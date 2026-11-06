
import uuid

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.email_outbox import EmailOutbox
from app.models.payment import MembershipPayment
from app.models.user import User


router = APIRouter(prefix="/payments", tags=["Payments"])

# Existing membership fee: ₹1,00,000 in paise.
MEMBERSHIP_FEE_PAISE = 10_000_000


class CreateOrderRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    mobile: str = Field(pattern=r"^[0-9]{10}$")


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay credentials are not configured.",
        )

    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


@router.post("/create-order")
def create_payment_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
):
    client = get_razorpay_client()

    receipt_id = uuid.uuid4().hex

    order = client.order.create(
        data={
            "amount": MEMBERSHIP_FEE_PAISE,
            "currency": "INR",
            "receipt": receipt_id,
        }
    )

    normalized_email = str(payload.email).strip().lower()

    payment = MembershipPayment(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        mobile=payload.mobile,
        amount=MEMBERSHIP_FEE_PAISE,
        currency="INR",
        razorpay_order_id=order["id"],
        status="created",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment order created successfully.",
        "key_id": settings.RAZORPAY_KEY_ID,
        "order_id": order["id"],
        "amount": MEMBERSHIP_FEE_PAISE,
        "currency": "INR",
        "name": payment.full_name,
        "email": payment.email,
        "mobile": payment.mobile,
    }


def get_or_create_customer(
    db: Session,
    payment_record: MembershipPayment,
) -> User:
    """Find an existing customer or create a new customer account."""

    normalized_email = payment_record.email.strip().lower()

    user = db.scalar(
        select(User).where(User.email == normalized_email)
    )

    if user:
        if user.role != "user":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This email is already associated with an admin account. "
                    "Please contact support."
                ),
            )

        return user

    user = User(
        full_name=payment_record.full_name,
        email=normalized_email,
        hashed_password=None,
        role="user",
        is_active=True,
        is_email_verified=False,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
        return user

    except IntegrityError:
        db.rollback()

        # Another request may have created this customer concurrently.
        user = db.scalar(
            select(User).where(User.email == normalized_email)
        )

        if user and user.role == "user":
            return user

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create the customer account for this email.",
        )


@router.post("/verify")
async def verify_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
):
    client = get_razorpay_client()

    payment_record = db.scalar(
        select(MembershipPayment).where(
            MembershipPayment.razorpay_order_id
            == payload.razorpay_order_id
        )
    )

    if not payment_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found.",
        )

    # Already-paid orders must use the same Razorpay payment ID.
    if payment_record.status == "paid":
        if payment_record.razorpay_payment_id != payload.razorpay_payment_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This order has already been paid with another payment ID.",
            )

    else:
        # Verify Razorpay signature.
        try:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": payload.razorpay_order_id,
                    "razorpay_payment_id": payload.razorpay_payment_id,
                    "razorpay_signature": payload.razorpay_signature,
                }
            )

        except razorpay.errors.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature.",
            )

        # Fetch payment details directly from Razorpay.
        razorpay_payment = client.payment.fetch(
            payload.razorpay_payment_id
        )

        if razorpay_payment.get("order_id") != payment_record.razorpay_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment order ID does not match.",
            )

        if razorpay_payment.get("amount") != payment_record.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount does not match.",
            )

        if razorpay_payment.get("currency") != payment_record.currency:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment currency does not match.",
            )

        # Only captured payments can create customer accounts.
        if razorpay_payment.get("status") != "captured":
            payment_record.status = razorpay_payment.get(
                "status", "failed"
            )
            db.commit()

            return {
                "message": "Payment has not been captured yet.",
                "status": payment_record.status,
            }

        payment_record.razorpay_payment_id = payload.razorpay_payment_id
        payment_record.status = "paid"

        db.commit()
        db.refresh(payment_record)

    # Create or retrieve the customer after successful payment.
    customer = get_or_create_customer(db, payment_record)

    # Lock the payment row so concurrent verification requests cannot
    # create duplicate outbox jobs for the same payment.
    payment_record = db.scalar(
        select(MembershipPayment)
        .where(
            MembershipPayment.razorpay_order_id
            == payload.razorpay_order_id
        )
        .with_for_update()
        .execution_options(populate_existing=True)
    )

    if not payment_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found.",
        )

    # The worker has already confirmed successful email delivery.
    if payment_record.welcome_email_sent:
        return {
            "message": "Payment already verified.",
            "status": "paid",
            "payment_id": payment_record.razorpay_payment_id,
            "welcome_email_sent": True,
            "email_queued": False,
        }

    # Check whether an outbox job already exists for this payment.
    existing_job = db.scalar(
        select(EmailOutbox).where(
            EmailOutbox.payment_id == payment_record.id
        )
    )

    if existing_job:
        # Do not create another job when verification is retried.
        db.commit()

        return {
            "message": "Payment verified. Welcome email is already queued.",
            "status": "paid",
            "payment_id": payment_record.razorpay_payment_id,
            "welcome_email_sent": False,
            "email_queued": True,
            "email_job_status": existing_job.status,
        }

    # Create a durable email job instead of sending SMTP email here.
    email_job = EmailOutbox(
        payment_id=payment_record.id,
        recipient_email=customer.email,
        recipient_name=customer.full_name,
        email_type="customer_welcome",
        status="pending",
        attempts=0,
    )

    db.add(email_job)

    try:
        # Save the email job before returning success.
        db.commit()
        db.refresh(email_job)

    except IntegrityError:
        # A unique payment_id constraint prevents duplicate jobs.
        db.rollback()

        existing_job = db.scalar(
            select(EmailOutbox).where(
                EmailOutbox.payment_id == payment_record.id
            )
        )

        if not existing_job:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to queue the welcome email. Please retry verification.",
            )

        return {
            "message": "Payment verified. Welcome email is already queued.",
            "status": "paid",
            "payment_id": payment_record.razorpay_payment_id,
            "welcome_email_sent": False,
            "email_queued": True,
            "email_job_status": existing_job.status,
        }

    return {
        "message": "Payment verified and customer account created successfully. Welcome email queued.",
        "status": "paid",
        "payment_id": payment_record.razorpay_payment_id,
        "customer_email": customer.email,
        "welcome_email_sent": False,
        "email_queued": True,
        "email_job_status": email_job.status,
    }

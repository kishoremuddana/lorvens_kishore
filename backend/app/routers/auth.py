
from datetime import datetime, timedelta, timezone
import hmac
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user_and_token
from app.core.security import create_access_token

from app.models.user import User
from app.models.payment import MembershipPayment

from app.schemas.auth import (
    MessageResponse,
    SendOTPRequest,
    TokenResponse,
    VerifyOTPRequest,
    # CustomerSendOTPRequest,
    # CustomerVerifyOTPRequest,
)

from app.services.email_service import (
    EmailDeliveryError,
    send_otp_email,
)

from app.services.otp_service import (
    OTPCooldownError,
    OTPExpiredError,
    OTPInvalidError,
    OTPMaxAttemptsError,
    OTPNotFoundError,
    OTPRequestLimitError,
    create_otp,
    verify_otp,
)

from app.services.token_service import revoke_token


router = APIRouter(prefix="/auth", tags=["Authentication"])


# --------------------------------------------------
# COMMON HELPERS
# --------------------------------------------------

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(
        select(User).where(User.email == email.lower())
    )


def has_successful_payment(db: Session, email: str) -> bool:
    payment = db.scalar(
        select(MembershipPayment.id).where(
            MembershipPayment.email == email.lower(),
            MembershipPayment.status == "paid",
        ).limit(1)
    )

    return payment is not None


def get_login_user(db: Session, email: str) -> User:
    normalized_email = email.strip().lower()

    user = get_user_by_email(db, normalized_email)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not found or inactive.",
        )

    if user.role == "admin":
        admin_email = settings.ADMIN_EMAIL.strip().lower()

        if not hmac.compare_digest(normalized_email, admin_email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This email is not authorized for admin access.",
            )

        return user

    if user.role == "user":
        if not has_successful_payment(db, normalized_email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No successful membership payment found for this email.",
            )

        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="This account is not authorized to log in.",
    )


def get_customer_by_mobile(db: Session, mobile: str) -> User:
    """
    Find a customer using their registered mobile number.
    A successful membership payment is required.
    """

    normalized_mobile = mobile.strip()

    paid_emails = db.scalars(
        select(MembershipPayment.email)
        .where(
            MembershipPayment.mobile == normalized_mobile,
            MembershipPayment.status == "paid",
        )
        .distinct()
    ).all()

    normalized_emails = {
        email.strip().lower()
        for email in paid_emails
        if email
    }

    if not normalized_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No successful membership found for this mobile number.",
        )

    if len(normalized_emails) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Multiple customer accounts are associated with this mobile number. Please contact support.",
        )

    email = next(iter(normalized_emails))

    user = db.scalar(
        select(User).where(
            User.email == email,
            User.role == "user",
            User.is_active.is_(True),
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer account not found or inactive.",
        )

    return user


def create_customer_access_token(user: User) -> TokenResponse:
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )


# --------------------------------------------------
# ADMIN EMAIL OTP LOGIN
# --------------------------------------------------


@router.post("/send-otp", response_model=MessageResponse)
async def send_login_otp(
    request: SendOTPRequest,
    db: Session = Depends(get_db),
):
    email = str(request.email).strip().lower()

    user = get_login_user(db, email)

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address is not verified.",
        )

    try:
        otp_record, otp = create_otp(db, user.id)

    except OTPCooldownError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        )

    except OTPRequestLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        )

    try:
        await send_otp_email(
            user.email,
            otp,
            account_type=user.role,
        )

    except EmailDeliveryError:
        otp_record.consumed_at = datetime.now(timezone.utc)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send OTP. Please try again later.",
        )

    return MessageResponse(
        message="OTP sent successfully."
    )



@router.post("/verify-otp", response_model=TokenResponse)
def verify_login_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    email = str(request.email).strip().lower()

    # Checks admin authorization or successful customer payment.
    user = get_login_user(db, email)

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address is not verified.",
        )

    try:
        verify_otp(db, user.id, request.otp)

    except OTPExpiredError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired.",
        )

    except OTPMaxAttemptsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP verification attempts exceeded.",
        )

    except OTPInvalidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
        )

    except OTPNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP.",
        )

    return create_customer_access_token(user)


# --------------------------------------------------
# CUSTOMER MOBILE OTP LOGIN
# --------------------------------------------------

# @router.post(
#     "/customer/send-otp",
#     response_model=MessageResponse,
# )
# def send_customer_otp(
#     request: CustomerSendOTPRequest,
#     db: Session = Depends(get_db),
# ):
#     mobile = request.mobile.strip()

#     # Find customer and confirm successful membership payment.
#     user = get_customer_by_mobile(db, mobile)

#     otp_mode = settings.CUSTOMER_OTP_MODE.strip().lower()

#     # Fixed OTP is allowed only in development/test mode.
#     if otp_mode == "fixed":
#         if settings.APP_ENV.strip().lower() == "production":
#             raise HTTPException(
#                 status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
#                 detail="Fixed OTP mode is disabled in production.",
#             )

#         otp_record, _ = create_otp(
#             db,
#             user.id,
#             otp_override=settings.CUSTOMER_TEST_OTP,
#         )

#         return MessageResponse(
#             message="Development OTP is ready. Use the configured test OTP."
#         )

#     # SMS provider integration has not been configured yet.
#     if otp_mode == "sms":
#         raise HTTPException(
#             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
#             detail="SMS OTP service is not configured yet.",
#         )

#     raise HTTPException(
#         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#         detail="Invalid customer OTP configuration.",
#     )


# @router.post(
#     "/customer/verify-otp",
#     response_model=TokenResponse,
# )
# def verify_customer_otp(
#     request: CustomerVerifyOTPRequest,
#     db: Session = Depends(get_db),
# ):
#     mobile = request.mobile.strip()

#     # Find customer and confirm successful membership payment.
#     user = get_customer_by_mobile(db, mobile)

#     try:
#         verify_otp(
#             db,
#             user.id,
#             request.otp,
#         )

#     except OTPExpiredError:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="OTP has expired.",
#         )

#     except OTPMaxAttemptsError:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Maximum OTP verification attempts exceeded.",
#         )

#     except OTPInvalidError:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid OTP.",
#         )

#     except OTPNotFoundError:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid or expired OTP.",
#         )

#     # Customer login successful.
#     return create_customer_access_token(user)


# --------------------------------------------------
# LOGOUT
# --------------------------------------------------

@router.post("/logout", response_model=MessageResponse)
def logout_user(
    auth_data: tuple[User, dict[str, Any]] = Depends(
        get_current_user_and_token
    ),
    db: Session = Depends(get_db),
):
    user, payload = auth_data

    expires_at = datetime.fromtimestamp(
        payload["exp"],
        tz=timezone.utc,
    )

    revoke_token(
        db,
        jti=payload["jti"],
        user_id=user.id,
        expires_at=expires_at,
    )

    return MessageResponse(
        message="Logged out successfully."
    )

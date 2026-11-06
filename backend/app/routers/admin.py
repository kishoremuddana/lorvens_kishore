import os
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.payment import MembershipPayment
from app.models.membership_application import MembershipApplication

router = APIRouter(prefix="/admin", tags=["Admin"])

UPLOAD_ROOT = Path(os.getenv(
    "LORVENS_PRIVATE_UPLOAD_DIR",
    str(Path(__file__).resolve().parents[2] / "private_uploads"),
)).resolve()

ALLOWED_DOCUMENT_TYPES = {
    "photo",
    "panDocument",
    "aadhaarDocument",
}


@router.get("/dashboard")
def admin_dashboard(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    submitted = func.lower(MembershipApplication.status) != "draft"

    total_applications = db.scalar(
        select(func.count(MembershipApplication.id)).where(submitted)
    ) or 0

    pending_applications = db.scalar(
        select(func.count(MembershipApplication.id)).where(
            submitted,
            func.lower(MembershipApplication.status) == "pending",
        )
    ) or 0

    total_paid_memberships = db.scalar(
        select(func.count(MembershipPayment.id)).where(
            func.lower(MembershipPayment.status) == "paid"
        )
    ) or 0

    total_registered_users = db.scalar(
        select(func.count(User.id)).where(
            func.lower(User.role) == "user"
        )
    ) or 0

    total_payments = db.scalar(
        select(func.count(MembershipPayment.id))
    ) or 0

    return {
        "message": "Welcome to Lorvens Admin Dashboard",
        "admin_email": admin.email,
        "role": admin.role,
        "statistics": {
            "total_applications": total_applications,
            "pending_applications": pending_applications,
            "total_registered_users": total_registered_users,
            "total_paid_memberships": total_paid_memberships,
            "total_payments": total_payments,
        },
    }


@router.get("/applications")
def get_membership_applications(
    search: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = select(MembershipApplication).where(
        func.lower(MembershipApplication.status) != "draft"
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                MembershipApplication.full_name.ilike(term),
                MembershipApplication.email.ilike(term),
                MembershipApplication.mobile.ilike(term),
            )
        )

    total = db.scalar(
        select(func.count()).select_from(query.subquery())
    ) or 0

    applications = db.scalars(
        query.order_by(MembershipApplication.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return {
        "items": [
            {
                "id": str(app.id),
                "full_name": app.full_name,
                "email": app.email,
                "mobile": app.mobile,
                "submitted_at": app.created_at,
            }
            for app in applications
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit,
        },
    }


@router.get("/applications/{application_id}")
def get_membership_application_details(
    application_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(MembershipApplication).where(
            MembershipApplication.id == application_id
        )
    )

    if not application or (application.status or "").lower() == "draft":
        raise HTTPException(
            status_code=404,
            detail="Membership application not found.",
        )

    payments = db.scalars(
        select(MembershipPayment)
        .where(
            func.lower(MembershipPayment.email)
            == application.email.lower()
        )
        .order_by(MembershipPayment.created_at.desc())
    ).all()

    documents = []

    for item in application.document_files or []:
        doc_type = item.get("document_type")

        if (
            doc_type in ALLOWED_DOCUMENT_TYPES
            and item.get("storage_key")
        ):
            documents.append({
                "document_type": doc_type,
                "file_name": item.get("file_name") or doc_type,
                "content_type": item.get("content_type"),
                "size": item.get("size"),
                "uploaded_at": item.get("uploaded_at"),
            })

    return {
        "id": str(application.id),
        "full_name": application.full_name,
        "email": application.email,
        "mobile": application.mobile,
        "application_data": application.application_data or {},
        "family_members": application.family_members or [],
        "document_files": documents,
        "submitted_at": application.created_at,
        "updated_at": application.updated_at,
        "payments": [
            {
                "id": str(payment.id),
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "razorpay_order_id": payment.razorpay_order_id,
                "razorpay_payment_id": payment.razorpay_payment_id,
                "welcome_email_sent": payment.welcome_email_sent,
                "created_at": payment.created_at,
            }
            for payment in payments
        ],
    }


@router.get(
    "/applications/{application_id}/documents/{document_type}"
)
def get_admin_application_document(
    application_id: UUID,
    document_type: str,
    download: bool = Query(default=False),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if document_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(status_code=404, detail="Document not found.")

    application = db.scalar(
        select(MembershipApplication).where(
            MembershipApplication.id == application_id
        )
    )

    if not application or (application.status or "").lower() == "draft":
        raise HTTPException(
            status_code=404,
            detail="Membership application not found.",
        )

    document = next(
        (
            item for item in (application.document_files or [])
            if item.get("document_type") == document_type
        ),
        None,
    )

    if not document or not document.get("storage_key"):
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = (
        UPLOAD_ROOT / document["storage_key"]
    ).resolve()

    if UPLOAD_ROOT not in file_path.parents or not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Stored document is unavailable.",
        )

    filename = Path(
        document.get("file_name") or document_type
    ).name

    return FileResponse(
        path=file_path,
        media_type=document.get("content_type") or "application/octet-stream",
        filename=filename,
        content_disposition_type="attachment" if download else "inline",
        headers={"X-Content-Type-Options": "nosniff"},
    )
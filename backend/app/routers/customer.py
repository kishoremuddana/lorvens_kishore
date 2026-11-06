import os

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_customer_user
from app.models.membership_application import MembershipApplication
from app.models.payment import MembershipPayment
from app.models.user import User

router = APIRouter(prefix="/customer", tags=["Customer"])
MAX_DOCUMENT_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    "photo": {".jpg", ".jpeg", ".png", ".webp"},
    "panDocument": {".jpg", ".jpeg", ".png", ".webp", ".pdf"},
    "aadhaarDocument": {".jpg", ".jpeg", ".png", ".webp", ".pdf"},
}
UPLOAD_ROOT = Path(os.getenv(
    "LORVENS_PRIVATE_UPLOAD_DIR",
    str(Path(__file__).resolve().parents[2] / "private_uploads"),
)).resolve()


class MembershipApplicationInput(BaseModel):
    application_data: dict[str, Any] = Field(default_factory=dict)
    family_members: list[dict[str, Any]] = Field(default_factory=list, max_length=5)


def _email(customer: User) -> str:
    return customer.email.strip().lower()


def _paid_payment(db: Session, email: str) -> MembershipPayment:
    payment = db.scalar(
        select(MembershipPayment)
        .where(
            func.lower(MembershipPayment.email) == email,
            MembershipPayment.status == "paid",
            MembershipPayment.welcome_email_sent.is_(True),
        )
        .order_by(MembershipPayment.created_at.desc())
        .limit(1)
    )
    if not payment:
        raise HTTPException(status_code=403, detail="Verified membership payment is required.")
    return payment


def _get_application(db: Session, email: str, lock: bool = False):
    query = (
        select(MembershipApplication)
        .where(func.lower(MembershipApplication.email) == email)
        .order_by(MembershipApplication.created_at.desc())
        .limit(1)
    )
    if lock:
        query = query.with_for_update()
    return db.scalar(query)


def _new_draft(db: Session, customer: User, payment: MembershipPayment):
    application = MembershipApplication(
        full_name=payment.full_name,
        mobile=payment.mobile,
        email=_email(customer),
        application_data={},
        family_members=[],
        document_files=[],
        status="Draft",
    )
    db.add(application)
    db.flush()
    return application


def _document(application: MembershipApplication, document_type: str):
    return next(
        (item for item in (application.document_files or [])
         if item.get("document_type") == document_type),
        None,
    )


def _response(application: MembershipApplication) -> dict:
    files = []
    for item in application.document_files or []:
        files.append({
            "document_type": item.get("document_type"),
            "file_name": item.get("file_name"),
            "content_type": item.get("content_type"),
            "size": item.get("size"),
            "uploaded_at": item.get("uploaded_at"),
            "download_url": (
                f"/api/v1/customer/application/documents/{item.get('document_type')}"
            ),
        })
    submitted = application.status != "Draft"
    return {
        "id": str(application.id),
        "full_name": application.full_name,
        "email": application.email,
        "mobile": application.mobile,
        "status": application.status,
        "submitted": submitted,
        "application_data": application.application_data or {},
        "family_members": application.family_members or [],
        "document_files": files,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
        "submitted_at": application.updated_at if submitted else None,
    }


def _delete_file(storage_key: str | None) -> None:
    if not storage_key:
        return
    try:
        path = (UPLOAD_ROOT / storage_key).resolve()
        if UPLOAD_ROOT in path.parents and path.is_file():
            path.unlink()
    except OSError:
        pass


def _detect_content(data: bytes) -> tuple[str, str]:
    if data.startswith(b"%PDF-"):
        return ".pdf", "application/pdf"
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg", "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png", "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp", "image/webp"
    raise HTTPException(status_code=415, detail="Invalid file. Upload a JPG, PNG, WEBP or PDF.")


@router.get("/dashboard")
def customer_dashboard(customer: User = Depends(get_customer_user), db: Session = Depends(get_db)):
    email = _email(customer)
    payment = _paid_payment(db, email)
    application = _get_application(db, email)
    return {
        "message": "Welcome to your Lorvens Membership Dashboard",
        "user": {"id": str(customer.id), "full_name": customer.full_name,
                 "email": customer.email, "role": customer.role},
        "membership": {
            "status": payment.status, "payment_status": payment.status,
            "welcome_email_sent": payment.welcome_email_sent,
            "amount_paise": payment.amount, "currency": payment.currency,
            "payment_id": payment.razorpay_payment_id, "mobile": payment.mobile,
            "created_at": payment.created_at,
        },
        "application": {
            "status": application.status.lower() if application else "not_started",
            "completed": bool(application and application.status != "Draft"),
        },
    }


@router.get("/application")
def get_my_application(customer: User = Depends(get_customer_user), db: Session = Depends(get_db)):
    application = _get_application(db, _email(customer))
    if not application:
        return {"submitted": False, "application": None}
    return {"submitted": application.status != "Draft", "application": _response(application)}


@router.put("/application/draft")
def save_application_draft(
    payload: MembershipApplicationInput,
    customer: User = Depends(get_customer_user),
    db: Session = Depends(get_db),
):
    email = _email(customer)
    payment = _paid_payment(db, email)
    try:
        application = _get_application(db, email, lock=True)
        if application and application.status != "Draft":
            raise HTTPException(status_code=409, detail="This application has already been submitted.")
        if not application:
            application = _new_draft(db, customer, payment)
        application.full_name = payment.full_name
        application.mobile = payment.mobile
        application.email = email
        application.application_data = payload.application_data
        application.family_members = payload.family_members
        application.status = "Draft"
        db.commit()
        db.refresh(application)
        return {"message": "Application draft saved successfully.", "saved": True,
                "application": _response(application)}
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save your application draft.")


@router.post("/application/documents")
async def upload_application_document(
    document_type: str,
    file: UploadFile = File(...),
    customer: User = Depends(get_customer_user),
    db: Session = Depends(get_db),
):
    if document_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid document type.")
    email = _email(customer)
    payment = _paid_payment(db, email)
    original_name = Path(file.filename or "document").name
    if Path(original_name).suffix.lower() not in ALLOWED_EXTENSIONS[document_type]:
        raise HTTPException(status_code=415, detail="File extension is not allowed for this document.")
    data = await file.read(MAX_DOCUMENT_SIZE + 1)
    await file.close()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_DOCUMENT_SIZE:
        raise HTTPException(status_code=413, detail="Each document must be 5 MB or smaller.")
    extension, content_type = _detect_content(data)
    if extension not in ALLOWED_EXTENSIONS[document_type]:
        raise HTTPException(status_code=415, detail="This file type is not allowed for this document.")

    application = _get_application(db, email, lock=True)
    if application and application.status != "Draft":
        raise HTTPException(status_code=409, detail="Documents cannot be changed after submission.")
    if not application:
        application = _new_draft(db, customer, payment)

    old = _document(application, document_type)
    storage_key = f"{application.id}/{secrets.token_hex(24)}{extension}"
    destination = (UPLOAD_ROOT / storage_key).resolve()
    if UPLOAD_ROOT not in destination.parents:
        raise HTTPException(status_code=400, detail="Invalid upload destination.")
    try:
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
        documents = [x for x in (application.document_files or [])
                     if x.get("document_type") != document_type]
        documents.append({
            "document_type": document_type,
            "file_name": original_name,
            "storage_key": storage_key,
            "content_type": content_type,
            "size": len(data),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        })
        application.document_files = documents
        db.commit()
        db.refresh(application)
    except Exception:
        db.rollback()
        _delete_file(storage_key)
        raise HTTPException(status_code=500, detail="Unable to store the uploaded document.")
    if old:
        _delete_file(old.get("storage_key"))
    return {"message": "Document uploaded successfully.",
            "document": {"document_type": document_type, "file_name": original_name,
                         "content_type": content_type, "size": len(data)}}


@router.get("/application/documents/{document_type}")
def download_application_document(
    document_type: str,
    customer: User = Depends(get_customer_user),
    db: Session = Depends(get_db),
):
    if document_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=404, detail="Document not found.")
    application = _get_application(db, _email(customer))
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    item = _document(application, document_type)
    if not item:
        raise HTTPException(status_code=404, detail="Document not found.")
    path = (UPLOAD_ROOT / item["storage_key"]).resolve()
    if UPLOAD_ROOT not in path.parents or not path.is_file():
        raise HTTPException(status_code=404, detail="Stored document is unavailable.")
    return FileResponse(path, media_type=item.get("content_type", "application/octet-stream"),
                        filename=Path(item.get("file_name", "document")).name,
                        content_disposition_type="attachment")


@router.post("/application")
def submit_membership_application(
    payload: MembershipApplicationInput,
    customer: User = Depends(get_customer_user),
    db: Session = Depends(get_db),
):
    email = _email(customer)
    payment = _paid_payment(db, email)
    try:
        application = _get_application(db, email, lock=True)
        if application and application.status != "Draft":
            raise HTTPException(status_code=409, detail="Your membership application has already been submitted.")
        if not application:
            application = _new_draft(db, customer, payment)
        application.application_data = payload.application_data
        application.family_members = payload.family_members
        # Supporting documents are optional. The required account details
        # (name, email and mobile) are sourced from the verified membership payment.
        application.full_name = payment.full_name
        application.mobile = payment.mobile
        application.email = email
        application.status = "Pending"
        db.commit()
        db.refresh(application)
        return {"message": "Membership application submitted successfully.",
                "application_id": str(application.id), "submitted": True,
                "submitted_at": application.updated_at}
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to submit your application.")

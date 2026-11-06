
import logging
import uuid
from typing import Any

import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

from app.core.config import settings

logger = logging.getLogger(__name__)


def configure_cloudinary() -> None:
    """Configure Cloudinary using backend environment settings."""

    if not all([
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    ]):
        raise RuntimeError(
            "Cloudinary credentials are missing. "
            "Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY "
            "and CLOUDINARY_API_SECRET in .env."
        )

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_document(
    file_data: bytes,
    filename: str,
    folder: str,
) -> dict[str, Any]:
    """
    Upload a membership document to Cloudinary.

    Documents use authenticated delivery so they are not
    publicly accessible through ordinary public URLs.
    """

    if not file_data:
        raise ValueError("Cannot upload an empty file.")

    configure_cloudinary()

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    resource_type = "raw" if extension == "pdf" else "image"

    public_id = f"{folder}/{uuid.uuid4().hex}"

    try:
        result = cloudinary.uploader.upload(
            file_data,
            public_id=public_id,
            resource_type=resource_type,
            type="authenticated",
            overwrite=False,
            unique_filename=False,
            use_filename=False,
            folder=None,
            context={
                "original_filename": filename,
            },
        )

        return {
            "cloudinary_public_id": result["public_id"],
            "secure_url": result.get("secure_url"),
            "resource_type": result.get("resource_type", resource_type),
            "delivery_type": result.get("type", "authenticated"),
            "format": result.get("format"),
            "size": result.get("bytes", len(file_data)),
        }

    except Exception:
        logger.exception("Cloudinary document upload failed.")
        raise RuntimeError("Unable to upload document to Cloudinary.")


def delete_document(
    public_id: str,
    resource_type: str = "image",
) -> bool:
    """Delete an existing authenticated Cloudinary document."""

    if not public_id:
        return False

    configure_cloudinary()

    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            type="authenticated",
            invalidate=True,
        )

        return result.get("result") == "ok"

    except Exception:
        logger.exception("Cloudinary document deletion failed.")
        return False


def get_document_url(
    public_id: str,
    resource_type: str = "image",
    file_format: str | None = None,
    attachment: bool = False,
) -> str:
    """
    Generate a signed URL for an authenticated Cloudinary asset.

    The caller must authorize the user before returning this URL.
    """

    if not public_id:
        raise ValueError("Cloudinary public ID is required.")

    configure_cloudinary()

    options = {
        "resource_type": resource_type,
        "type": "authenticated",
        "secure": True,
        "sign_url": True,
    }

    if file_format:
        options["format"] = file_format

    if attachment:
        options["flags"] = "attachment"

    url, _ = cloudinary_url(public_id, **options)

    return url

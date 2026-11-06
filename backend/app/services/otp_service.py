
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_otp import EmailOTP
from app.models.user import User


class OTPError(Exception):
    """Base exception for OTP operations."""
    pass


class OTPCooldownError(OTPError):
    """Raised when an OTP request is within the resend cooldown window."""
    pass


class OTPRequestLimitError(OTPError):
    """Raised when the hourly OTP request limit is exceeded."""
    pass


class OTPExpiredError(OTPError):
    """Raised when the OTP has expired."""
    pass


class OTPMaxAttemptsError(OTPError):
    """Raised when the maximum number of incorrect OTP attempts is reached."""
    pass


class OTPInvalidError(OTPError):
    """Raised when an incorrect OTP is entered."""
    pass


class OTPNotFoundError(OTPError):
    """Raised when no active OTP exists for the user."""
    pass


def generate_otp() -> str:
    """Generate a cryptographically secure numeric OTP."""
    return "".join(
        str(secrets.randbelow(10))
        for _ in range(settings.OTP_LENGTH)
    )


def hash_otp(otp: str) -> str:
    """Hash OTP using HMAC-SHA256 with the JWT secret key."""
    return hmac.new(
        settings.JWT_SECRET_KEY.encode(),
        otp.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_otp_hash(otp: str, stored_hash: str) -> bool:
    """Compare OTP hashes using constant-time comparison."""
    return hmac.compare_digest(
        hash_otp(otp),
        stored_hash,
    )


def check_otp_rate_limit(db: Session, user_id) -> None:
    """Check OTP resend cooldown and hourly request limits."""

    now = datetime.now(timezone.utc)

    latest_otp = db.scalar(
        select(EmailOTP)
        .where(EmailOTP.user_id == user_id)
        .order_by(desc(EmailOTP.created_at))
        .limit(1)
    )

    if latest_otp:
        created_at = latest_otp.created_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(
                tzinfo=timezone.utc
            )

        elapsed = (now - created_at).total_seconds()

        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = max(
                1,
                int(
                    settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed
                ),
            )

            raise OTPCooldownError(
                f"Please wait {remaining} seconds before requesting another OTP."
            )

    one_hour_ago = now - timedelta(hours=1)

    requests_count = db.scalar(
        select(func.count())
        .select_from(EmailOTP)
        .where(
            EmailOTP.user_id == user_id,
            EmailOTP.created_at >= one_hour_ago,
        )
    ) or 0

    if requests_count >= settings.OTP_MAX_REQUESTS_PER_HOUR:
        raise OTPRequestLimitError(
            "OTP request limit reached. Try again after one hour."
        )


def create_otp(
    db: Session,
    user_id,
    otp_override: str | None = None,
) -> tuple[EmailOTP, str]:
    """
    Create and persist a new OTP.

    Admin:
        Uses a randomly generated OTP.

    Customer development login:
        Can use the configured fixed OTP through otp_override.

    The OTP is stored as a hash and the previous unused OTP
    is invalidated.
    """

    # Validate an explicitly supplied OTP.
    if otp_override is not None:
        if (
            not otp_override.isdigit()
            or len(otp_override) != settings.OTP_LENGTH
        ):
            raise ValueError(
                f"OTP must contain exactly {settings.OTP_LENGTH} numeric digits."
            )

    # Lock the user row to serialize OTP operations.
    db.execute(
        select(User.id)
        .where(User.id == user_id)
        .with_for_update()
    )

    now = datetime.now(timezone.utc)

    # Check resend cooldown and hourly limits.
    check_otp_rate_limit(db, user_id)

    # Invalidate all previous unused OTPs for this user.
    previous_otps = db.scalars(
        select(EmailOTP)
        .where(
            EmailOTP.user_id == user_id,
            EmailOTP.consumed_at.is_(None),
        )
        .with_for_update()
    ).all()

    for previous in previous_otps:
        previous.consumed_at = now

    # Generate random OTP unless an override was explicitly supplied.
    otp = (
        otp_override
        if otp_override is not None
        else generate_otp()
    )

    # Store only the hashed OTP.
    otp_record = EmailOTP(
        user_id=user_id,
        otp_hash=hash_otp(otp),
        expires_at=now + timedelta(
            minutes=settings.OTP_EXPIRE_MINUTES
        ),
        attempts=0,
        created_at=now,
    )

    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)

    return otp_record, otp


def verify_otp(
    db: Session,
    user_id,
    otp: str,
) -> bool:
    """
    Verify OTP validity, expiration, attempt count and single-use status.
    """

    # Lock the user row to serialize verification attempts.
    db.execute(
        select(User.id)
        .where(User.id == user_id)
        .with_for_update()
    )

    now = datetime.now(timezone.utc)

    otp_record = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.user_id == user_id,
            EmailOTP.consumed_at.is_(None),
        )
        .order_by(desc(EmailOTP.created_at))
        .limit(1)
        .with_for_update()
    )

    if not otp_record:

        # Check the latest OTP to return a meaningful error.
        latest = db.scalar(
            select(EmailOTP)
            .where(EmailOTP.user_id == user_id)
            .order_by(desc(EmailOTP.created_at))
            .limit(1)
        )

        if latest:

            if latest.attempts >= settings.OTP_MAX_ATTEMPTS:
                raise OTPMaxAttemptsError(
                    "Maximum OTP verification attempts exceeded."
                )

            latest_exp = latest.expires_at

            if latest_exp.tzinfo is None:
                latest_exp = latest_exp.replace(
                    tzinfo=timezone.utc
                )

            if latest_exp <= now:
                raise OTPExpiredError(
                    "OTP has expired."
                )

        raise OTPNotFoundError(
            "Invalid or expired OTP."
        )

    expires_at = otp_record.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    # Check expiration.
    if expires_at <= now:
        otp_record.consumed_at = now
        db.commit()

        raise OTPExpiredError(
            "OTP has expired."
        )

    # Check maximum attempts.
    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp_record.consumed_at = now
        db.commit()

        raise OTPMaxAttemptsError(
            "Maximum OTP verification attempts exceeded."
        )

    # Verify OTP.
    if not verify_otp_hash(otp, otp_record.otp_hash):

        otp_record.attempts += 1

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp_record.consumed_at = now
            db.commit()

            raise OTPMaxAttemptsError(
                "Maximum OTP verification attempts exceeded."
            )

        db.commit()

        raise OTPInvalidError(
            "Invalid OTP."
        )

    # Successful verification: consume OTP immediately.
    otp_record.consumed_at = now
    db.commit()

    return True

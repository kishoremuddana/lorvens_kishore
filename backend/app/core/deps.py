
from typing import Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.payment import MembershipPayment
from app.services.token_service import is_token_revoked


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_and_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> tuple[User, dict[str, Any]]:
    """Validate Bearer token, signature, expiration, and revocation."""

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
        jti = payload["jti"]

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if is_token_revoked(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return user, payload


def get_current_user(
    auth_data: tuple[User, dict[str, Any]] = Depends(
        get_current_user_and_token
    ),
) -> User:
    """Return the authenticated user."""

    user, _ = auth_data
    return user


def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Validate an active and verified admin."""

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive.",
        )

    if (
        current_user.role != "admin"
        or not current_user.is_email_verified
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    return current_user


def get_authenticated_admin_context(
    auth_data: tuple[User, dict[str, Any]] = Depends(
        get_current_user_and_token
    ),
) -> tuple[User, dict[str, Any]]:
    """Return authenticated admin and JWT claims."""

    user, payload = auth_data

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive.",
        )

    if (
        user.role != "admin"
        or not user.is_email_verified
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    return user, payload



def get_customer_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Validate an active customer with a paid membership and sent welcome email."""

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer account is inactive.",
        )

    if current_user.role != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required.",
        )

    paid_membership = db.scalar(
        select(MembershipPayment.id)
        .where(
            MembershipPayment.email == current_user.email.lower(),
            MembershipPayment.status == "paid",
            MembershipPayment.welcome_email_sent.is_(True),
        )
        .limit(1)
    )

    if not paid_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Paid membership with successful welcome email required.",
        )

    return current_user

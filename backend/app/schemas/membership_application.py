
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class MembershipApplicationCreate(BaseModel):
    """
    Data accepted from the public membership application form.
    Only full_name, mobile, and email are mandatory.
    """

    full_name: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )

    mobile: str = Field(
        ...,
        min_length=8,
        max_length=20,
        pattern=r"^[0-9+() -]+$",
    )

    email: EmailStr

    application_data: dict[str, Any] = Field(
        default_factory=dict,
    )

    family_members: list[dict[str, Any]] = Field(
        default_factory=list,
        max_length=5,
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Full name cannot be empty.")

        return value

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return value.strip().lower()


class MembershipApplicationResponse(BaseModel):
    """Application information returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    mobile: str
    email: EmailStr
    status: str
    created_at: datetime
    updated_at: datetime


class MembershipApplicationListResponse(BaseModel):
    """Response containing multiple membership applications."""

    total: int
    applications: list[MembershipApplicationResponse]


class MembershipApplicationStatusUpdate(BaseModel):
    """Schema for admin application status updates."""

    status: str = Field(
        ...,
        pattern=r"^(Pending|Approved|Rejected)$",
    )

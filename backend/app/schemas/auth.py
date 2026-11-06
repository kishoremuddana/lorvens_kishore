from pydantic import BaseModel, EmailStr, Field


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^[0-9]{6}$",
    )


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

    # Authenticated account details for role-based frontend routing
    user_id: str
    email: EmailStr
    full_name: str
    role: str
    
# class CustomerSendOTPRequest(BaseModel):
#     mobile: str = Field(
#         ...,
#         min_length=10,
#         max_length=10,
#         pattern=r"^[0-9]{10}$",
#     )


# class CustomerVerifyOTPRequest(BaseModel):
#     mobile: str = Field(
#         ...,
#         min_length=10,
#         max_length=10,
#         pattern=r"^[0-9]{10}$",
#     )
#     otp: str = Field(
#         ...,
#         min_length=6,
#         max_length=6,
#         pattern=r"^[0-9]{6}$",
#     )
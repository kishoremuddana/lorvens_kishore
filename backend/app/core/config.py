from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator

class Settings(BaseSettings):
    APP_NAME: str = "Lorvens API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    ADMIN_EMAIL: str

    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_MAX_REQUESTS_PER_HOUR: int = 5

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True
    
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    
    APP_ENV: str = "development"

    # Customer phone OTP only
    CUSTOMER_OTP_MODE: str = "fixed"
    CUSTOMER_TEST_OTP: str = ""

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent.parent / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )
    @model_validator(mode="after")
    def validate_customer_otp_settings(self):
        self.APP_ENV = self.APP_ENV.strip().lower()
        self.CUSTOMER_OTP_MODE = self.CUSTOMER_OTP_MODE.strip().lower()

        if self.CUSTOMER_OTP_MODE not in {"fixed", "sms"}:
            raise ValueError("CUSTOMER_OTP_MODE must be 'fixed' or 'sms'.")

        if self.CUSTOMER_OTP_MODE == "fixed":
            if self.APP_ENV == "production":
                raise ValueError("Fixed customer OTP is not allowed in production.")

            if not self.CUSTOMER_TEST_OTP.isdigit() or len(self.CUSTOMER_TEST_OTP) != 6:
                raise ValueError("CUSTOMER_TEST_OTP must contain exactly 6 digits.")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

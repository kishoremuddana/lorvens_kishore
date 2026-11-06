
import os
from html import escape
from email.message import EmailMessage

import aiosmtplib
from aiosmtplib.errors import SMTPException

from app.core.config import settings


class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""


# Set FRONTEND_URL in your .env file to your actual website URL.
# Example: FRONTEND_URL=https://yourdomain.com
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).rstrip("/")

LOGIN_URL = f"{FRONTEND_URL}/login"


async def _send_email(
    message: EmailMessage,
    recipient_email: str,
) -> None:
    """Shared SMTP delivery function."""

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            sender=settings.SMTP_FROM_EMAIL,
            recipients=[recipient_email],
            start_tls=settings.SMTP_USE_TLS,
            timeout=20,
        )

    except (SMTPException, OSError) as exc:
        raise EmailDeliveryError(
            "Unable to deliver email."
        ) from exc


def _add_html_content(
    message: EmailMessage,
    plain_text: str,
    html_content: str,
) -> None:
    """Add plain-text and HTML versions to an email."""

    message.set_content(plain_text)
    message.add_alternative(
        html_content,
        subtype="html",
    )


def _build_email_layout(
    heading: str,
    subtitle: str,
    body_content: str,
) -> str:
    """Create the common Lorvens email layout."""

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">
    <title>{escape(heading)}</title>
</head>

<body style="
    margin:0;
    padding:30px 12px;
    background-color:#f2f5f3;
    font-family:Arial,Helvetica,sans-serif;
    color:#263b32;
">

<table role="presentation" width="100%"
       cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">

<table role="presentation" width="100%"
       cellpadding="0" cellspacing="0" border="0"
       style="
           max-width:560px;
           background:#ffffff;
           border:1px solid #e5e9e5;
           border-radius:12px;
           overflow:hidden;
       ">

    <!-- Header -->
    <tr>
        <td align="center"
            style="background:#003629;padding:38px 24px;">

            <div style="
                color:#dfba69;
                font-family:Georgia,serif;
                font-size:28px;
                font-weight:bold;
                letter-spacing:4px;
            ">
                LORVENS CLUB
            </div>

            <div style="
                color:#e4c77e;
                font-size:11px;
                font-weight:bold;
                letter-spacing:4px;
                margin-top:10px;
            ">
                EXCLUSIVE MEMBERSHIP
            </div>

            <div style="
                width:70px;
                height:1px;
                background:#b8954c;
                margin:22px auto;
            "></div>

            <div style="
                color:#ffffff;
                font-family:Georgia,serif;
                font-size:25px;
                font-weight:bold;
            ">
                {escape(heading)}
            </div>

            <div style="
                color:#e2eae5;
                font-size:14px;
                margin-top:10px;
            ">
                {escape(subtitle)}
            </div>

        </td>
    </tr>

    <!-- Email content -->
    <tr>
        <td style="padding:35px 30px;">
            {body_content}
        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td align="center"
            style="background:#003629;padding:24px 15px;">

            <div style="
                color:#e4c77e;
                font-family:Georgia,serif;
                font-size:16px;
                font-weight:bold;
                letter-spacing:2px;
            ">
                LORVENS CLUB
            </div>

            <div style="
                color:#dce6df;
                font-size:11px;
                margin-top:9px;
            ">
                Exclusive Membership
            </div>

        </td>
    </tr>

</table>
</td>
</tr>
</table>

</body>
</html>
"""


def _build_otp_email_html(
    otp: str,
    account_name: str,
    account_label: str,
    expiry_minutes: int,
) -> str:
    """Build the branded OTP email."""

    safe_name = escape(account_name)
    safe_otp = escape(otp)

    body_content = f"""
        <h2 style="
            color:#173d30;
            font-size:20px;
            margin:0 0 16px;
        ">
            Hello {safe_name},
        </h2>

        <p style="
            color:#45534c;
            font-size:15px;
            line-height:1.8;
            margin:0 0 22px;
        ">
            Use the following verification code to securely
            sign in to your Lorvens {escape(account_label)} account.
        </p>

        <!-- OTP Box -->
        <table role="presentation" width="100%"
               cellpadding="0" cellspacing="0" border="0"
               style="
                   background:#f6f1e5;
                   border:1px solid #e8dcc0;
                   border-radius:9px;
               ">
            <tr>
                <td align="center" style="padding:25px 12px;">

                    <div style="
                        color:#81642d;
                        font-size:11px;
                        font-weight:bold;
                        letter-spacing:2px;
                        margin-bottom:14px;
                    ">
                        YOUR VERIFICATION CODE
                    </div>

                    <div style="
                        color:#173d30;
                        font-size:36px;
                        font-weight:bold;
                        letter-spacing:9px;
                    ">
                        {safe_otp}
                    </div>

                </td>
            </tr>
        </table>

        <p style="
            color:#45534c;
            font-size:14px;
            line-height:1.7;
            margin:24px 0 18px;
        ">
            This OTP expires in
            <strong>{expiry_minutes} minutes.</strong>
            Please complete your login before it expires.
        </p>

        <table role="presentation" width="100%"
               cellpadding="0" cellspacing="0" border="0"
               style="
                   background:#f2f5f3;
                   border-left:3px solid #c9a34f;
                   border-radius:4px;
               ">
            <tr>
                <td style="
                    padding:16px;
                    color:#526257;
                    font-size:13px;
                    line-height:1.8;
                ">
                    <strong style="color:#173d30;">
                        Security Reminder
                    </strong>
                    <br>
                    Do not share this OTP with anyone.
                    Lorvens Club staff will never ask you
                    to disclose your verification code.
                </td>
            </tr>
        </table>

        <p style="
            color:#68756d;
            font-size:13px;
            line-height:1.7;
            margin:22px 0 0;
        ">
            If you did not request this login, you can
            ignore this email.
        </p>
    """

    return _build_email_layout(
        heading="Login Verification",
        subtitle="Secure access to your Lorvens account",
        body_content=body_content,
    )


async def send_otp_email(
    recipient_email: str,
    otp: str,
    account_type: str = "admin",
) -> None:
    """Send a branded OTP email for admin or customer login."""

    if account_type == "admin":
        account_name = "Administrator"
        account_label = "administrator"
        subject = "Lorvens Club - Administrator Login Verification"
    else:
        account_name = "Member"
        account_label = "member"
        subject = "Lorvens Club - Member Login Verification"

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient_email

    plain_text = f"""
Hello {account_name},

Your Lorvens Club login verification code is:

{otp}

This OTP is valid for {settings.OTP_EXPIRE_MINUTES} minutes.

Security Reminder:
- Do not share this OTP with anyone.
- This OTP can only be used once.
- Request a new OTP if this one expires.

If you did not request this login, you can ignore this email.

Regards,
Lorvens Club Team
"""

    html_content = _build_otp_email_html(
        otp=otp,
        account_name=account_name,
        account_label=account_label,
        expiry_minutes=settings.OTP_EXPIRE_MINUTES,
    )

    _add_html_content(
        message,
        plain_text,
        html_content,
    )

    await _send_email(message, recipient_email)


async def send_customer_otp_email(
    recipient_email: str,
    otp: str,
) -> None:
    """Send a branded customer login OTP."""

    await send_otp_email(
        recipient_email=recipient_email,
        otp=otp,
        account_type="customer",
    )


async def send_customer_welcome_email(
    recipient_email: str,
    full_name: str,
) -> None:
    """Send a branded welcome email after successful payment."""

    safe_name = escape(full_name)
    safe_email = escape(recipient_email)
    safe_login_url = escape(LOGIN_URL, quote=True)

    message = EmailMessage()
    message["Subject"] = "Welcome to Lorvens Club!"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient_email

    plain_text = f"""
Hello {full_name},

Welcome to Lorvens Club!

Your membership payment has been successfully verified,
and your customer account has been created.

You can now access your customer dashboard.

How to log in:
1. Open the Lorvens Club website.
2. Enter your registered email address: {recipient_email}
3. Request a new login OTP.
4. Enter the OTP received in your email to access your account.

You do not need a password. A new OTP is required for every login.

Login: {LOGIN_URL}

Thank you for joining Lorvens Club!

Regards,
Lorvens Club Team
"""

    body_content = f"""
        <h2 style="
            color:#173d30;
            font-size:20px;
            margin:0 0 18px;
        ">
            Hello {safe_name},
        </h2>

        <p style="
            color:#45534c;
            font-size:15px;
            line-height:1.8;
        ">
            Welcome to Lorvens Club!
        </p>

        <p style="
            color:#45534c;
            font-size:15px;
            line-height:1.8;
        ">
            Your membership payment has been successfully verified,
            and your customer account has been created.
        </p>

        <p style="
            color:#45534c;
            font-size:15px;
            line-height:1.8;
        ">
            You can now access your customer dashboard.
        </p>

        <h3 style="
            color:#173d30;
            font-size:17px;
            margin-top:28px;
        ">
            How to log in
        </h3>

        <ol style="
            color:#45534c;
            font-size:14px;
            line-height:2;
            padding-left:22px;
        ">
            <li>Open the Lorvens Club website.</li>
            <li>
                Enter your registered email address:
                <strong>{safe_email}</strong>
            </li>
            <li>Request a new login OTP.</li>
            <li>
                Enter the OTP received in your email to access
                your account.
            </li>
        </ol>

        <!-- Login button -->
        <table role="presentation" width="100%"
               cellpadding="0" cellspacing="0" border="0"
               style="margin:28px 0;">
            <tr>
                <td align="center">
                    <a href="{safe_login_url}"
                       style="
                           display:inline-block;
                           background:#c9a34f;
                           color:#003629;
                           text-decoration:none;
                           font-size:15px;
                           font-weight:bold;
                           letter-spacing:1px;
                           padding:16px 34px;
                           border-radius:7px;
                       ">
                        GO TO LOGIN
                    </a>
                </td>
            </tr>
        </table>

        <p style="
            color:#68756d;
            font-size:13px;
            line-height:1.8;
        ">
            You do not need a password. A new OTP is required
            for every login.
        </p>

        <p style="
            color:#45534c;
            font-size:14px;
            line-height:1.8;
            margin-top:25px;
        ">
            Thank you for joining Lorvens Club!
            <br><br>
            Regards,<br>
            <strong>Lorvens Club Team</strong>
        </p>
    """

    html_content = _build_email_layout(
        heading="Welcome to Lorvens Club!",
        subtitle="Your membership journey begins here",
        body_content=body_content,
    )

    _add_html_content(
        message,
        plain_text,
        html_content,
    )

    await _send_email(message, recipient_email)

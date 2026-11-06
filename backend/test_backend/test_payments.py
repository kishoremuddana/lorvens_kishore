
import unittest
import uuid
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.main import app
from app.models.email_outbox import EmailOutbox
from app.models.payment import MembershipPayment
from app.models.user import User
from app.routers.payments import MEMBERSHIP_FEE_PAISE


class TestMembershipPayments(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()

        self.email = (
            f"payment-test-{uuid.uuid4().hex[:12]}@example.com"
        )
        self.order_id = f"order_{uuid.uuid4().hex}"
        self.payment_id = f"pay_{uuid.uuid4().hex}"

        self.payload = {
            "full_name": "Payment Test User",
            "email": self.email,
            "mobile": "9876543210",
        }

        self.payment = None

    def tearDown(self):
        # Delete outbox jobs before deleting their payment records.
        self.db.execute(
            delete(EmailOutbox).where(
                EmailOutbox.payment_id.in_(
                    select(MembershipPayment.id).where(
                        MembershipPayment.email == self.email
                    )
                )
            )
        )

        self.db.execute(
            delete(MembershipPayment).where(
                MembershipPayment.email == self.email
            )
        )

        self.db.execute(
            delete(User).where(User.email == self.email)
        )

        self.db.commit()
        self.db.close()

    def create_payment_record(self, **overrides):
        values = {
            "full_name": "Payment Test User",
            "email": self.email,
            "mobile": "9876543210",
            "amount": MEMBERSHIP_FEE_PAISE,
            "currency": "INR",
            "razorpay_order_id": self.order_id,
            "status": "created",
            "welcome_email_sent": False,
        }

        values.update(overrides)

        self.payment = MembershipPayment(**values)

        self.db.add(self.payment)
        self.db.commit()
        self.db.refresh(self.payment)

        return self.payment

    def get_customer(self):
        return self.db.scalar(
            select(User).where(User.email == self.email)
        )

    def get_outbox_job(self):
        if not self.payment:
            return None

        return self.db.scalar(
            select(EmailOutbox).where(
                EmailOutbox.payment_id == self.payment.id
            )
        )

    def verify_payload(self):
        return {
            "razorpay_order_id": self.order_id,
            "razorpay_payment_id": self.payment_id,
            "razorpay_signature": "valid-signature",
        }

    def mock_captured_payment(
        self,
        mock_get_client,
        **overrides,
    ):
        payment_data = {
            "order_id": self.order_id,
            "amount": MEMBERSHIP_FEE_PAISE,
            "currency": "INR",
            "status": "captured",
        }

        payment_data.update(overrides)

        mock_client = MagicMock()
        mock_client.payment.fetch.return_value = payment_data
        mock_get_client.return_value = mock_client

        return mock_client

    @patch("app.routers.payments.get_razorpay_client")
    def test_create_order_success(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.order.create.return_value = {
            "id": self.order_id
        }
        mock_get_client.return_value = mock_client

        response = self.client.post(
            "/api/v1/payments/create-order",
            json=self.payload,
        )

        self.assertEqual(response.status_code, 200, response.text)

        data = response.json()

        self.assertEqual(data["order_id"], self.order_id)
        self.assertEqual(data["amount"], MEMBERSHIP_FEE_PAISE)
        self.assertEqual(data["currency"], "INR")
        self.assertEqual(data["email"], self.email)

        saved_payment = self.db.scalar(
            select(MembershipPayment).where(
                MembershipPayment.razorpay_order_id == self.order_id
            )
        )

        self.assertIsNotNone(saved_payment)
        self.assertEqual(saved_payment.status, "created")

    @patch("app.routers.payments.get_razorpay_client")
    def test_create_order_missing_credentials(self, mock_get_client):
        mock_get_client.side_effect = HTTPException(
            status_code=500,
            detail="Razorpay credentials are not configured.",
        )

        response = self.client.post(
            "/api/v1/payments/create-order",
            json=self.payload,
        )

        self.assertEqual(response.status_code, 500)

    @patch("app.routers.payments.get_razorpay_client")
    def test_verify_unknown_order(self, mock_get_client):
        mock_get_client.return_value = MagicMock()

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 404)

    @patch("app.routers.payments.get_razorpay_client")
    def test_verify_invalid_signature(self, mock_get_client):
        import razorpay

        self.create_payment_record()

        mock_client = MagicMock()
        mock_client.utility.verify_payment_signature.side_effect = (
            razorpay.errors.SignatureVerificationError(
                "Invalid signature"
            )
        )
        mock_get_client.return_value = mock_client

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "Invalid payment signature.",
        )

    @patch("app.routers.payments.get_razorpay_client")
    def test_verify_wrong_order_id(self, mock_get_client):
        self.create_payment_record()

        self.mock_captured_payment(
            mock_get_client,
            order_id="different_order",
        )

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "Payment order ID does not match.",
        )
        self.assertIsNone(self.get_customer())
        self.assertIsNone(self.get_outbox_job())

    @patch("app.routers.payments.get_razorpay_client")
    def test_verify_wrong_amount(self, mock_get_client):
        self.create_payment_record()

        self.mock_captured_payment(
            mock_get_client,
            amount=100,
        )

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "Payment amount does not match.",
        )
        self.assertIsNone(self.get_customer())
        self.assertIsNone(self.get_outbox_job())

    @patch("app.routers.payments.get_razorpay_client")
    def test_verify_wrong_currency(self, mock_get_client):
        self.create_payment_record()

        self.mock_captured_payment(
            mock_get_client,
            currency="USD",
        )

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "Payment currency does not match.",
        )
        self.assertIsNone(self.get_customer())
        self.assertIsNone(self.get_outbox_job())

    @patch("app.routers.payments.get_razorpay_client")
    def test_payment_not_captured(self, mock_get_client):
        self.create_payment_record()

        self.mock_captured_payment(
            mock_get_client,
            status="authorized",
        )

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "authorized")

        self.assertIsNone(self.get_customer())
        self.assertIsNone(self.get_outbox_job())

    @patch("app.routers.payments.get_razorpay_client")
    def test_successful_payment_creates_customer_and_queues_email(
        self,
        mock_get_client,
    ):
        self.create_payment_record()
        self.mock_captured_payment(mock_get_client)

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 200, response.text)

        data = response.json()

        self.assertEqual(data["status"], "paid")
        self.assertFalse(data["welcome_email_sent"])
        self.assertTrue(data["email_queued"])
        self.assertEqual(data["email_job_status"], "pending")
        self.assertEqual(data["customer_email"], self.email)

        customer = self.get_customer()

        self.assertIsNotNone(customer)
        self.assertEqual(customer.role, "user")
        self.assertIsNone(customer.hashed_password)
        self.assertTrue(customer.is_active)
        self.assertFalse(customer.is_email_verified)

        job = self.get_outbox_job()

        self.assertIsNotNone(job)
        self.assertEqual(job.payment_id, self.payment.id)
        self.assertEqual(job.recipient_email, self.email)
        self.assertEqual(job.recipient_name, "Payment Test User")
        self.assertEqual(job.email_type, "customer_welcome")
        self.assertEqual(job.status, "pending")
        self.assertEqual(job.attempts, 0)

        self.db.expire_all()

        saved_payment = self.db.scalar(
            select(MembershipPayment).where(
                MembershipPayment.razorpay_order_id == self.order_id
            )
        )

        self.assertEqual(saved_payment.status, "paid")
        self.assertFalse(saved_payment.welcome_email_sent)

    @patch("app.routers.payments.get_razorpay_client")
    def test_admin_email_cannot_become_customer(self, mock_get_client):
        self.create_payment_record()

        mock_admin = User(
            full_name="Existing Admin",
            email=self.email,
            hashed_password="existing-hash",
            role="admin",
            is_active=True,
            is_email_verified=True,
        )

        self.db.add(mock_admin)
        self.db.commit()

        self.mock_captured_payment(mock_get_client)

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 409)

        self.db.refresh(mock_admin)

        self.assertEqual(mock_admin.role, "admin")
        self.assertIsNone(self.get_outbox_job())

    @patch("app.routers.payments.get_razorpay_client")
    def test_welcome_email_job_is_not_duplicated_on_retry(
        self,
        mock_get_client,
    ):
        self.create_payment_record()
        self.mock_captured_payment(mock_get_client)

        first_response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(
            first_response.status_code,
            200,
            first_response.text,
        )

        first_job = self.get_outbox_job()
        self.assertIsNotNone(first_job)

        # Payment is already paid. No Razorpay fetch is needed on retry.
        mock_get_client.return_value = MagicMock()

        retry_response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(
            retry_response.status_code,
            200,
            retry_response.text,
        )

        self.assertTrue(retry_response.json()["email_queued"])
        self.assertFalse(retry_response.json()["welcome_email_sent"])

        jobs = self.db.scalars(
            select(EmailOutbox).where(
                EmailOutbox.payment_id == self.payment.id
            )
        ).all()

        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0].id, first_job.id)
        self.assertEqual(jobs[0].status, "pending")

    @patch("app.routers.payments.get_razorpay_client")
    def test_already_sent_welcome_email_is_not_queued_again(
        self,
        mock_get_client,
    ):
        self.create_payment_record(
            status="paid",
            razorpay_payment_id=self.payment_id,
            welcome_email_sent=True,
        )

        self.db.add(
            User(
                full_name="Payment Test User",
                email=self.email,
                hashed_password=None,
                role="user",
                is_active=True,
                is_email_verified=False,
            )
        )
        self.db.commit()

        mock_get_client.return_value = MagicMock()

        response = self.client.post(
            "/api/v1/payments/verify",
            json=self.verify_payload(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["welcome_email_sent"])
        self.assertFalse(response.json()["email_queued"])
        self.assertIsNone(self.get_outbox_job())

    @patch("app.routers.payments.get_razorpay_client")
    def test_different_payment_id_for_paid_order_is_rejected(
        self,
        mock_get_client,
    ):
        self.create_payment_record(
            status="paid",
            razorpay_payment_id=self.payment_id,
        )

        mock_get_client.return_value = MagicMock()

        response = self.client.post(
            "/api/v1/payments/verify",
            json={
                "razorpay_order_id": self.order_id,
                "razorpay_payment_id": "pay_different",
                "razorpay_signature": "signature",
            },
        )

        self.assertEqual(response.status_code, 409)
        self.assertIsNone(self.get_outbox_job())


if __name__ == "__main__":
    unittest.main()

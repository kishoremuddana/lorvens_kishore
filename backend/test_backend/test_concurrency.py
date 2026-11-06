
import os
import sys
import threading
import unittest
import uuid

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
)

from app.core.database import SessionLocal
from app.main import app
from app.models.email_otp import EmailOTP
from app.models.email_outbox import EmailOutbox
from app.models.payment import MembershipPayment
from app.models.user import User
from app.services.admin_service import ensure_admin_account
from app.services.otp_service import (
    create_otp,
    OTPCooldownError,
)


class TestOTPConcurrency(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db = SessionLocal()

        try:
            cls.admin = ensure_admin_account(db)
            cls.admin_id = cls.admin.id
        finally:
            db.close()

    def setUp(self):
        db = SessionLocal()

        try:
            db.execute(
                delete(EmailOTP).where(
                    EmailOTP.user_id == self.admin_id
                )
            )
            db.commit()
        finally:
            db.close()

    def test_concurrent_create_otp_prevents_simultaneous_active_otps(self):
        results = []
        errors = []

        barrier = threading.Barrier(5)

        def worker():
            db = SessionLocal()

            try:
                barrier.wait(timeout=10)

                record, otp = create_otp(
                    db,
                    self.admin_id,
                )

                results.append((record.id, otp))

            except OTPCooldownError as exc:
                errors.append(exc)

            except Exception as exc:
                errors.append(exc)

            finally:
                db.close()

        threads = [
            threading.Thread(target=worker)
            for _ in range(5)
        ]

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join(timeout=20)

        self.assertTrue(
            all(not thread.is_alive() for thread in threads),
            "An OTP concurrency thread did not finish.",
        )

        self.assertEqual(
            len(results),
            1,
            f"Expected exactly 1 success, got {len(results)}",
        )

        self.assertEqual(
            len(errors),
            4,
            f"Expected 4 cooldown errors, got {len(errors)}",
        )

        db = SessionLocal()

        try:
            active_otps = db.scalars(
                select(EmailOTP).where(
                    EmailOTP.user_id == self.admin_id,
                    EmailOTP.consumed_at.is_(None),
                )
            ).all()

            self.assertEqual(len(active_otps), 1)

        finally:
            db.close()


class TestPaymentConcurrency(unittest.TestCase):

    def setUp(self):
        unique_id = uuid.uuid4().hex

        self.email = f"concurrency_{unique_id}@example.com"
        self.order_id = f"order_{unique_id}"
        self.payment_id = f"pay_{unique_id}"

        db = SessionLocal()

        try:
            customer = User(
                full_name="Concurrency Test Customer",
                email=self.email,
                hashed_password=None,
                role="user",
                is_active=True,
                is_email_verified=False,
            )

            db.add(customer)

            payment = MembershipPayment(
                full_name="Concurrency Test Customer",
                email=self.email,
                mobile="9876543210",
                amount=10_000_000,
                currency="INR",
                razorpay_order_id=self.order_id,
                razorpay_payment_id=self.payment_id,
                status="paid",
                welcome_email_sent=False,
            )

            db.add(payment)
            db.commit()

        finally:
            db.close()

    def tearDown(self):
        db = SessionLocal()

        try:
            payment = db.scalar(
                select(MembershipPayment).where(
                    MembershipPayment.razorpay_order_id
                    == self.order_id
                )
            )

            if payment:
                db.execute(
                    delete(EmailOutbox).where(
                        EmailOutbox.payment_id == payment.id
                    )
                )

            db.execute(
                delete(MembershipPayment).where(
                    MembershipPayment.razorpay_order_id
                    == self.order_id
                )
            )

            db.execute(
                delete(User).where(
                    User.email == self.email
                )
            )

            db.commit()

        finally:
            db.close()

    def test_concurrent_payment_verification_creates_only_one_outbox_job(self):
        """
        Two simultaneous verification requests must create
        only one welcome email outbox job.
        """

        start_barrier = threading.Barrier(2)

        responses = []
        errors = []

        def worker():
            try:
                start_barrier.wait(timeout=10)

                with TestClient(app) as client:
                    response = client.post(
                        "/api/v1/payments/verify",
                        json={
                            "razorpay_order_id": self.order_id,
                            "razorpay_payment_id": self.payment_id,
                            "razorpay_signature": "mock_signature",
                        },
                    )

                    responses.append(response)

            except Exception as exc:
                errors.append(exc)

        # The payment is already marked paid, so verification should
        # not need Razorpay signature verification or payment fetching.
        threads = [
            threading.Thread(target=worker)
            for _ in range(2)
        ]

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join(timeout=20)

        self.assertTrue(
            all(not thread.is_alive() for thread in threads),
            "A payment verification thread did not finish.",
        )

        self.assertEqual(
            len(errors),
            0,
            f"Unexpected thread errors: {errors}",
        )

        self.assertEqual(
            len(responses),
            2,
            "Both verification requests should complete.",
        )

        for response in responses:
            self.assertEqual(
                response.status_code,
                200,
                response.text,
            )

        db = SessionLocal()

        try:
            # Exactly one customer should exist.
            customers = db.scalars(
                select(User).where(
                    User.email == self.email
                )
            ).all()

            self.assertEqual(
                len(customers),
                1,
                "Duplicate customer accounts were created.",
            )

            payment = db.scalar(
                select(MembershipPayment).where(
                    MembershipPayment.razorpay_order_id
                    == self.order_id
                )
            )

            self.assertIsNotNone(payment)

            # Email has only been queued, not delivered yet.
            self.assertFalse(payment.welcome_email_sent)

            # Exactly one outbox job should exist.
            jobs = db.scalars(
                select(EmailOutbox).where(
                    EmailOutbox.payment_id == payment.id
                )
            ).all()

            self.assertEqual(
                len(jobs),
                1,
                "Concurrent verification created duplicate outbox jobs.",
            )

            self.assertEqual(jobs[0].status, "pending")
            self.assertEqual(jobs[0].attempts, 0)
            self.assertEqual(jobs[0].recipient_email, self.email)
            self.assertEqual(
                jobs[0].email_type,
                "customer_welcome",
            )

        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()

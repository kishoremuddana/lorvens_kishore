
import asyncio
import logging
import signal
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import and_, or_, select, update

from app.core.database import SessionLocal
from app.models.email_outbox import EmailOutbox
from app.models.payment import MembershipPayment
from app.services.email_service import send_customer_welcome_email


# --------------------------------------------------
# LOGGING CONFIGURATION
# --------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)


# --------------------------------------------------
# WORKER CONFIGURATION
# --------------------------------------------------

POLL_INTERVAL_SECONDS = 5
MAX_ATTEMPTS = 5

PROCESSING_TIMEOUT_MINUTES = 5
HEARTBEAT_INTERVAL_SECONDS = 60

MAX_RETRY_DELAY_SECONDS = 6 * 60 * 60


# --------------------------------------------------
# CLAIM EMAIL JOB
# --------------------------------------------------

def claim_email_job():
    """Atomically claim one due email job."""

    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        stale_before = now - timedelta(
            minutes=PROCESSING_TIMEOUT_MINUTES
        )

        job = db.scalar(
            select(EmailOutbox)
            .where(
                or_(
                    and_(
                        EmailOutbox.status == "pending",
                        EmailOutbox.next_attempt_at <= now,
                    ),
                    and_(
                        EmailOutbox.status == "processing",
                        EmailOutbox.updated_at <= stale_before,
                    ),
                )
            )
            .order_by(
                EmailOutbox.next_attempt_at,
                EmailOutbox.created_at,
            )
            .with_for_update(skip_locked=True)
            .limit(1)
        )

        if job is None:
            return None

        job.status = "processing"
        job.updated_at = now

        job_id = job.id

        db.commit()

        logger.info("Claimed email job: %s", job_id)

        return job_id

    except Exception:
        db.rollback()
        logger.exception("Unable to claim an email job")
        raise

    finally:
        db.close()


# --------------------------------------------------
# EMAIL JOB HEARTBEAT
# --------------------------------------------------

async def maintain_job_heartbeat(
    job_id: UUID,
    stop_event: asyncio.Event,
):
    """
    Refresh updated_at periodically while an email is being sent.

    This prevents active jobs from being considered stale.
    """

    logger.info("Heartbeat started for email job: %s", job_id)

    try:
        while not stop_event.is_set():

            try:
                await asyncio.wait_for(
                    stop_event.wait(),
                    timeout=HEARTBEAT_INTERVAL_SECONDS,
                )
                break

            except asyncio.TimeoutError:
                pass

            db = SessionLocal()

            try:
                now = datetime.now(timezone.utc)

                result = db.execute(
                    update(EmailOutbox)
                    .where(
                        EmailOutbox.id == job_id,
                        EmailOutbox.status == "processing",
                    )
                    .values(updated_at=now)
                )

                db.commit()

                if result.rowcount == 0:
                    logger.warning(
                        "Heartbeat stopped: job %s is no longer processing",
                        job_id,
                    )
                    break

                logger.info(
                    "Heartbeat refreshed for email job: %s",
                    job_id,
                )

            except Exception:
                db.rollback()

                logger.exception(
                    "Unable to refresh heartbeat for job %s",
                    job_id,
                )

            finally:
                db.close()

    except asyncio.CancelledError:
        logger.info(
            "Heartbeat cancelled for email job: %s",
            job_id,
        )
        raise

    finally:
        logger.info("Heartbeat stopped for email job: %s", job_id)


# --------------------------------------------------
# PROCESS EMAIL JOB
# --------------------------------------------------

async def process_email_job(job_id: UUID):
    """Send one claimed email and update its database status."""

    db = SessionLocal()

    try:
        job = db.get(EmailOutbox, job_id)

        if job is None or job.status != "processing":
            return

        payment = db.get(
            MembershipPayment,
            job.payment_id,
        )

        if payment is None or payment.status != "paid":
            job.status = "failed"
            job.last_error = (
                "Related paid membership payment was not found."
            )

            db.commit()

            logger.error(
                "Email job %s failed: payment not found or unpaid",
                job_id,
            )
            return

        recipient_email = job.recipient_email
        recipient_name = job.recipient_name

    finally:
        db.close()

    # --------------------------------------------------
    # SEND EMAIL WITH HEARTBEAT
    # --------------------------------------------------

    heartbeat_stop_event = asyncio.Event()

    heartbeat_task = asyncio.create_task(
        maintain_job_heartbeat(
            job_id,
            heartbeat_stop_event,
        )
    )

    try:
        await send_customer_welcome_email(
            recipient_email=recipient_email,
            full_name=recipient_name,
        )

    except Exception as exc:

        heartbeat_stop_event.set()
        await heartbeat_task

        db = SessionLocal()

        try:
            job = db.get(EmailOutbox, job_id)

            if job is None or job.status != "processing":
                return

            job.attempts += 1
            job.last_error = str(exc)[:4000]

            if job.attempts >= MAX_ATTEMPTS:
                job.status = "failed"

                logger.error(
                    "Email job %s permanently failed after %s attempts",
                    job_id,
                    job.attempts,
                )

            else:
                delay = min(
                    60 * (2 ** (job.attempts - 1)),
                    MAX_RETRY_DELAY_SECONDS,
                )

                job.status = "pending"

                job.next_attempt_at = (
                    datetime.now(timezone.utc)
                    + timedelta(seconds=delay)
                )

                logger.warning(
                    "Email job %s failed. Retry %s scheduled in %s seconds",
                    job_id,
                    job.attempts,
                    delay,
                )

            db.commit()

        except Exception:
            db.rollback()

            logger.exception(
                "Unable to update failed email job"
            )

        finally:
            db.close()

        return

    else:
        heartbeat_stop_event.set()
        await heartbeat_task

    # --------------------------------------------------
    # MARK EMAIL AS SUCCESSFULLY SENT
    # --------------------------------------------------

    db = SessionLocal()

    try:
        job = db.get(EmailOutbox, job_id)

        if job is None or job.status != "processing":
            return

        payment = db.get(
            MembershipPayment,
            job.payment_id,
        )

        job.status = "sent"
        job.sent_at = datetime.now(timezone.utc)
        job.last_error = None

        if payment is not None:
            payment.welcome_email_sent = True

        db.commit()

        logger.info(
            "Welcome email sent successfully to %s",
            job.recipient_email,
        )

    except Exception:
        db.rollback()

        logger.exception(
            "Email was sent but database status could not be updated"
        )

    finally:
        db.close()


# --------------------------------------------------
# MAIN WORKER WITH GRACEFUL SHUTDOWN
# --------------------------------------------------

async def run_worker(stop_event: asyncio.Event | None = None):
    """
    Run the email worker.

    When called by FastAPI, FastAPI controls the stop_event.
    When run directly with python -m app.services.email_worker,
    the worker handles its own shutdown signals.
    """

    standalone = stop_event is None

    if stop_event is None:
        stop_event = asyncio.Event()

    logger.info("Lorvens email worker started")

    loop = asyncio.get_running_loop()

    def request_shutdown():
        if not stop_event.is_set():
            logger.info(
                "Shutdown signal received. Finishing current job..."
            )
            stop_event.set()

    # Register signals only when running as a standalone process.
    # FastAPI/Uvicorn manages its own process signals.
    if standalone:
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, request_shutdown)

            except (NotImplementedError, RuntimeError):
                try:
                    signal.signal(
                        sig,
                        lambda signum, frame: loop.call_soon_threadsafe(
                            request_shutdown
                        ),
                    )
                except (ValueError, OSError):
                    logger.warning(
                        "Could not register signal handler: %s", sig
                    )

    try:
        while not stop_event.is_set():
            try:
                job_id = claim_email_job()

                if job_id is None:
                    try:
                        await asyncio.wait_for(
                            stop_event.wait(),
                            timeout=POLL_INTERVAL_SECONDS,
                        )
                    except asyncio.TimeoutError:
                        pass

                    continue

                # Finish the current job before stopping.
                await process_email_job(job_id)

            except asyncio.CancelledError:
                logger.warning("Email worker task cancelled.")
                raise

            except Exception:
                logger.exception("Email worker encountered an error")

                try:
                    await asyncio.wait_for(
                        stop_event.wait(),
                        timeout=POLL_INTERVAL_SECONDS,
                    )
                except asyncio.TimeoutError:
                    pass

    finally:
        logger.info("Lorvens email worker stopped")


# --------------------------------------------------
# APPLICATION ENTRY POINT
# --------------------------------------------------

if __name__ == "__main__":
    try:
        asyncio.run(run_worker())

    except KeyboardInterrupt:
        logger.info("Lorvens email worker stopped")

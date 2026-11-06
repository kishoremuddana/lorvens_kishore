
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import Base
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.payments import router as payments_router
from app.services.admin_service import ensure_admin_account
from app.services.email_worker import run_worker
from app.routers.customer import router as customer_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the admin account.
    db: Session = SessionLocal()

    try:
        ensure_admin_account(db)
    finally:
        db.close()

    # Start the email worker automatically.
    worker_stop_event = asyncio.Event()

    worker_task = asyncio.create_task(
        run_worker(worker_stop_event),
        name="lorvens-email-worker",
    )

    app.state.email_worker_task = worker_task

    logger.info("Email worker started through FastAPI lifespan")

    try:
        yield

    finally:
        # Ask the worker to finish its current job and stop.
        logger.info("Stopping Lorvens email worker...")

        worker_stop_event.set()

        try:
            await asyncio.wait_for(
                worker_task,
                timeout=30,
            )

        except asyncio.TimeoutError:
            logger.warning(
                "Email worker did not stop within 30 seconds. "
                "Cancelling worker task."
            )

            worker_task.cancel()

            try:
                await worker_task
            except asyncio.CancelledError:
                pass


app = FastAPI(
    title="Lorvens API",
    description="Lorvens Admin Authentication API",
    version="1.0.0",
    lifespan=lifespan,
)


# Enable CORS for frontend applications (website & admin portal).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(customer_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Lorvens API is running"}

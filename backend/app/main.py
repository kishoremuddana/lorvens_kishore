from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import Base
from app.routers.auth import router as auth_router
from app.services.admin_service import ensure_admin_account
from app.routers.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    db: Session = SessionLocal()

    try:
        ensure_admin_account(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="Lorvens API",
    description="Lorvens Admin Authentication API",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend applications (website & admin portal)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Lorvens API is running"}

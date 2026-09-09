from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app import models  # noqa: F401 - ensures models are registered before create_all

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FollowApp API",
    description="Continuity-of-care platform connecting patients, clinicians, and healthcare organisations after a consultation.",
    version="0.1.0",
)

# CORS - tighten allow_origins before production use
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "FollowApp API"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}

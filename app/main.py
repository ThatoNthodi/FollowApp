from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app import models, schemas
from app.logic import sync_overdue_tasks
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_clinician,
)

Base.metadata.create_all(bind=engine)

# Lightweight startup migration: add columns introduced after the initial
# create_all, since create_all only creates missing tables, not new columns
# on existing ones. Fine for this MVP's scale; a real migration tool
# (Alembic) would replace this once the schema stabilizes.
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE clinicians ADD COLUMN IF NOT EXISTS hashed_password VARCHAR"))
    conn.execute(text("ALTER TABLE clinicians ADD COLUMN IF NOT EXISTS practice_number VARCHAR"))
    conn.execute(text("ALTER TABLE clinicians ADD COLUMN IF NOT EXISTS council VARCHAR"))
    conn.commit()

app = FastAPI(
    title="FollowApp API",
    description="Continuity-of-care platform connecting patients, clinicians, and healthcare organisations after a consultation.",
    version="0.2.0",
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


# ---------- Auth ----------

@app.post("/auth/register", response_model=schemas.ClinicianOut, tags=["auth"])
def register_clinician(clinician: schemas.ClinicianCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Clinician).filter(models.Clinician.email == clinician.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A clinician with this email already exists")

    db_clinician = models.Clinician(
        full_name=clinician.full_name,
        practice_number=clinician.practice_number,
        council=clinician.council,
        email=clinician.email,
        hashed_password=hash_password(clinician.password),
    )
    db.add(db_clinician)
    db.commit()
    db.refresh(db_clinician)
    return db_clinician


@app.post("/auth/login", response_model=schemas.Token, tags=["auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm's "username" field carries the clinician's email.
    clinician = db.query(models.Clinician).filter(models.Clinician.email == form_data.username).first()
    if not clinician or not clinician.hashed_password or not verify_password(
        form_data.password, clinician.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": clinician.id})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.ClinicianOut, tags=["auth"])
def get_me(current_clinician: models.Clinician = Depends(get_current_clinician)):
    return current_clinician


# ---------- Patients ----------

@app.post("/patients", response_model=schemas.PatientOut, tags=["patients"])
def create_patient(
    patient: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    db_patient = models.Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@app.get("/patients", response_model=List[schemas.PatientOut], tags=["patients"])
def list_patients(
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    return db.query(models.Patient).all()


@app.get("/patients/{patient_id}", response_model=schemas.PatientOut, tags=["patients"])
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


# ---------- Clinicians ----------

@app.get("/clinicians", response_model=List[schemas.ClinicianOut], tags=["clinicians"])
def list_clinicians(
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    return db.query(models.Clinician).all()


@app.get("/clinicians/{clinician_id}", response_model=schemas.ClinicianOut, tags=["clinicians"])
def get_clinician(
    clinician_id: str,
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    clinician = db.query(models.Clinician).filter(models.Clinician.id == clinician_id).first()
    if not clinician:
        raise HTTPException(status_code=404, detail="Clinician not found")
    return clinician


# ---------- Consultations ----------

@app.post("/consultations", response_model=schemas.ConsultationOut, tags=["consultations"])
def create_consultation(
    consultation: schemas.ConsultationCreate,
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    patient = db.query(models.Patient).filter(models.Patient.id == consultation.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db_consultation = models.Consultation(
        patient_id=consultation.patient_id,
        clinician_id=current_clinician.id,
        notes=consultation.notes,
        condition=consultation.condition,
    )
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)

    for task in consultation.follow_up_tasks:
        db_task = models.FollowUpTask(
            consultation_id=db_consultation.id,
            **task.model_dump(),
        )
        db.add(db_task)
    db.commit()
    db.refresh(db_consultation)

    return db_consultation


@app.get("/consultations", response_model=List[schemas.ConsultationOut], tags=["consultations"])
def list_consultations(
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    return db.query(models.Consultation).all()


@app.get("/consultations/{consultation_id}", response_model=schemas.ConsultationOut, tags=["consultations"])
def get_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation


# ---------- Follow-up tasks ----------

@app.get("/follow-up-tasks", response_model=List[schemas.FollowUpTaskOut], tags=["follow-up-tasks"])
def list_follow_up_tasks(
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    sync_overdue_tasks(db)
    return db.query(models.FollowUpTask).all()


@app.get("/follow-up-tasks/overdue", response_model=List[schemas.FollowUpTaskOut], tags=["follow-up-tasks"])
def list_overdue_follow_up_tasks(
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    """Tasks whose due date has passed and are still not completed."""
    sync_overdue_tasks(db)
    return (
        db.query(models.FollowUpTask)
        .filter(models.FollowUpTask.status == models.TaskStatus.overdue)
        .all()
    )


@app.get(
    "/patients/{patient_id}/continuity-summary",
    response_model=schemas.PatientContinuitySummary,
    tags=["follow-up-tasks"],
)
def get_patient_continuity_summary(
    patient_id: str,
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    """Outstanding care tasks for one patient, across all their consultations."""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    sync_overdue_tasks(db)

    tasks = (
        db.query(models.FollowUpTask)
        .join(models.Consultation)
        .filter(models.Consultation.patient_id == patient_id)
        .all()
    )

    overdue_tasks = [t for t in tasks if t.status == models.TaskStatus.overdue]

    return schemas.PatientContinuitySummary(
        patient_id=patient.id,
        full_name=patient.full_name,
        total_tasks=len(tasks),
        pending=sum(1 for t in tasks if t.status == models.TaskStatus.pending),
        overdue=len(overdue_tasks),
        completed=sum(1 for t in tasks if t.status == models.TaskStatus.completed),
        overdue_tasks=overdue_tasks,
    )


@app.patch("/follow-up-tasks/{task_id}/complete", response_model=schemas.FollowUpTaskOut, tags=["follow-up-tasks"])
def complete_follow_up_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_clinician: models.Clinician = Depends(get_current_clinician),
):
    task = db.query(models.FollowUpTask).filter(models.FollowUpTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Follow-up task not found")
    task.status = models.TaskStatus.completed
    db.commit()
    db.refresh(task)
    return task

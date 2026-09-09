from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.models import TaskStatus


# ---------- Patient ----------

class PatientCreate(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    created_at: datetime


# ---------- Clinician ----------

class ClinicianCreate(BaseModel):
    full_name: str
    hpcsa_number: Optional[str] = None
    email: Optional[str] = None


class ClinicianOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    hpcsa_number: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime


# ---------- Follow-up task ----------

class FollowUpTaskCreate(BaseModel):
    description: str
    due_date: Optional[datetime] = None
    requires_clinician_review: bool = False


class FollowUpTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    consultation_id: str
    description: str
    due_date: Optional[datetime] = None
    status: TaskStatus
    requires_clinician_review: bool
    created_at: datetime


# ---------- Consultation ----------

class ConsultationCreate(BaseModel):
    patient_id: str
    clinician_id: str
    notes: Optional[str] = None
    condition: Optional[str] = None
    follow_up_tasks: List[FollowUpTaskCreate] = []


class ConsultationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    clinician_id: str
    consultation_date: datetime
    notes: Optional[str] = None
    condition: Optional[str] = None
    follow_up_tasks: List[FollowUpTaskOut] = []

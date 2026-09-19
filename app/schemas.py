from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict

from app.models import TaskStatus


# ---------- Patient ----------

class PatientCreate(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class PatientSignup(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    email: str
    password: str
    consent: bool


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    consent_given: bool = False
    consent_given_at: Optional[datetime] = None
    created_at: datetime


class ConsentUpdate(BaseModel):
    consent: bool


# ---------- Clinician ----------

class ClinicianCreate(BaseModel):
    full_name: str
    practice_number: str
    council: Literal["HPCSA", "SANC"]
    email: str
    password: str


class ClinicianOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    practice_number: Optional[str] = None
    council: Optional[str] = None
    email: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime


class ClinicianActivityOut(ClinicianOut):
    patient_count: int
    consultation_count: int
    overdue_task_count: int
    completed_task_count: int


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_type: str
    actor_id: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime


class PracticeDashboardOut(BaseModel):
    clinician_count: int
    admin_count: int
    patient_count: int
    consultation_count: int
    pending_task_count: int
    overdue_task_count: int
    completed_task_count: int
    task_completion_rate: float  # completed / (completed + overdue + pending)
    ai_conversation_count: int
    ai_conversations_flagged: int
    ai_conversations_pending_review: int  # flagged and not yet reviewed
    recent_activity: List[AuditLogOut]


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
    reminder_sent_at: Optional[datetime] = None
    reminder_delivery_status: Optional[str] = None
    patient_response: Optional[str] = None


# ---------- Consultation ----------

class ConsultationCreate(BaseModel):
    patient_id: str
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


# ---------- Continuity summary ----------

class PatientContinuitySummary(BaseModel):
    patient_id: str
    full_name: str
    total_tasks: int
    pending: int
    overdue: int
    completed: int
    overdue_tasks: List[FollowUpTaskOut] = []


# ---------- Auth ----------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class MeResponse(BaseModel):
    role: str
    clinician: Optional[ClinicianOut] = None
    patient: Optional[PatientOut] = None


# ---------- Patient portal (public, read-only) ----------

class PatientPortalView(BaseModel):
    patient: PatientOut
    summary: PatientContinuitySummary
    consultations: List[ConsultationOut] = []
class AIChatRequest(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    answer: str
    requires_human_review: bool = False


class AIConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    patient: Optional[PatientOut] = None
    message: str
    answer: str
    category: str
    requires_human_review: bool
    reviewed_at: Optional[datetime] = None
    reviewed_by_clinician_id: Optional[str] = None
    created_at: datetime


class FeedbackCreate(BaseModel):
    message: str


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    message: str
    created_at: datetime

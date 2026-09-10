import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Enum,
    Text,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class TaskStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    overdue = "overdue"


class FollowUpStatus(str, enum.Enum):
    scheduled = "scheduled"
    due = "due"
    overdue = "overdue"
    completed = "completed"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)  # for WhatsApp integration later
    email = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    consultations = relationship("Consultation", back_populates="patient")


class Clinician(Base):
    __tablename__ = "clinicians"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    practice_number = Column(String, nullable=True)
    council = Column(String, nullable=True)  # "HPCSA" or "SANC"
    email = Column(String, nullable=True, unique=True)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    consultations = relationship("Consultation", back_populates="clinician")


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    patient_id = Column(UUID(as_uuid=False), ForeignKey("patients.id"), nullable=False)
    clinician_id = Column(UUID(as_uuid=False), ForeignKey("clinicians.id"), nullable=False)
    consultation_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    condition = Column(String, nullable=True)  # e.g. "Hypertension", "Diabetes"

    patient = relationship("Patient", back_populates="consultations")
    clinician = relationship("Clinician", back_populates="consultations")
    follow_up_tasks = relationship("FollowUpTask", back_populates="consultation")


class FollowUpTask(Base):
    """A single actionable item in a patient's care pathway after a consultation
    e.g. 'Complete blood test', 'Attend follow-up', 'Monitor blood pressure'."""

    __tablename__ = "follow_up_tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    consultation_id = Column(UUID(as_uuid=False), ForeignKey("consultations.id"), nullable=False)
    description = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    requires_clinician_review = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    consultation = relationship("Consultation", back_populates="follow_up_tasks")

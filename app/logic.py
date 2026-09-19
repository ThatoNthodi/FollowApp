from datetime import datetime
from sqlalchemy.orm import Session

from app import models
from app.audit import log_audit_event
from app.email_service import send_overdue_task_notification


def sync_overdue_tasks(db: Session) -> int:
    """Flip any pending follow-up task whose due_date has passed to 'overdue',
    email the responsible clinician, and record an audit entry.

    Called at the top of read endpoints, and also by the in-process
    scheduler, so statuses stay accurate and clinicians get notified even
    when nobody happens to be using the app. The pending -> overdue
    transition only happens once per task (afterwards it no longer matches
    this filter), so this naturally notifies/logs only once per task, not
    on every check. Returns the number of tasks updated.
    """
    now = datetime.utcnow()
    stale_tasks = (
        db.query(models.FollowUpTask)
        .join(models.Consultation)
        .filter(
            models.FollowUpTask.status == models.TaskStatus.pending,
            models.FollowUpTask.due_date.isnot(None),
            models.FollowUpTask.due_date < now,
        )
        .all()
    )

    for task in stale_tasks:
        task.status = models.TaskStatus.overdue

        log_audit_event(
            db,
            actor_type="system",
            actor_id=None,
            action="task_status_changed",
            resource_type="follow_up_task",
            resource_id=task.id,
            details="pending -> overdue (automatic)",
        )

        try:
            consultation = task.consultation
            send_overdue_task_notification(
                clinician_email=consultation.clinician.email,
                patient_name=consultation.patient.full_name,
                task_description=task.description,
                due_date=task.due_date,
            )
        except Exception:
            # Notification is a convenience only - never let a failure here
            # block the status update itself.
            pass

    if stale_tasks:
        db.commit()

    return len(stale_tasks)

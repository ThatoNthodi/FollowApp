from datetime import datetime
from sqlalchemy.orm import Session

from app import models


def sync_overdue_tasks(db: Session) -> int:
    """Flip any pending follow-up task whose due_date has passed to 'overdue'.

    Called at the top of read endpoints so statuses stay accurate without
    needing a separate background scheduler for the MVP. Returns the number
    of tasks updated.
    """
    now = datetime.utcnow()
    stale_tasks = (
        db.query(models.FollowUpTask)
        .filter(
            models.FollowUpTask.status == models.TaskStatus.pending,
            models.FollowUpTask.due_date.isnot(None),
            models.FollowUpTask.due_date < now,
        )
        .all()
    )

    for task in stale_tasks:
        task.status = models.TaskStatus.overdue

    if stale_tasks:
        db.commit()

    return len(stale_tasks)

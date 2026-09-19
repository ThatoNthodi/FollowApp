from app import models


def log_audit_event(
    db,
    actor_type: str,
    actor_id,
    action: str,
    resource_type: str | None = None,
    resource_id=None,
    details: str | None = None,
) -> None:
    """Queue an audit log entry on the given session.

    Does NOT commit - the caller's own commit (for whatever action is
    being logged) persists this too, so the audit entry and the action
    it describes land atomically, in the same transaction.
    """
    entry = models.AuditLog(
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
    )
    db.add(entry)

"""
In-process background scheduler.

Runs sync_overdue_tasks on a timer inside the existing FastAPI process,
instead of a separate Render Cron Job (which has no free-tier plan).

Trade-off worth knowing: Render's free web-service plan spins the
service down after a period of no incoming requests, which pauses this
scheduler too until the next request wakes it back up. So this covers
"someone visits the app at some point during the day" rather than a
true always-on guarantee. If the free-plan sleep behaviour turns out to
delay overdue notifications too much in practice, a paid always-on plan
(or a Render Cron Job) would close that gap - noted here so the
trade-off isn't forgotten later.
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.logic import sync_overdue_tasks

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def _run_sync_overdue_tasks():
    db = SessionLocal()
    try:
        updated = sync_overdue_tasks(db)
        if updated:
            logger.info("Scheduled sync: flipped %d task(s) to overdue", updated)
    except Exception:
        logger.exception("Scheduled overdue-task sync failed")
    finally:
        db.close()


def start_scheduler():
    if scheduler.running:
        return
    scheduler.add_job(
        _run_sync_overdue_tasks,
        "interval",
        hours=1,
        id="sync_overdue_tasks",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)

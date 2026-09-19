import os
import smtplib
from email.mime.text import MIMEText

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def send_feedback_notification(user_role: str, user_id: str | None, message: str) -> None:
    """
    Email a notification when new feedback is submitted.

    Does nothing if Gmail credentials aren't configured. Feedback
    submission must never fail because this notification channel is
    missing or broken - any error here is swallowed by the caller.
    """
    if not (GMAIL_ADDRESS and GMAIL_APP_PASSWORD):
        return

    subject = f"New FollowApp feedback ({user_role})"
    body = (
        f"Role: {user_role}\n"
        f"User ID: {user_id or 'anonymous'}\n\n"
        f"{message}"
    )

    email = MIMEText(body)
    email["Subject"] = subject
    email["From"] = GMAIL_ADDRESS
    email["To"] = GMAIL_ADDRESS

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.send_message(email)


def send_overdue_task_notification(
    clinician_email: str | None,
    patient_name: str,
    task_description: str,
    due_date,
) -> None:
    """
    Email a clinician when one of their patients' follow-up tasks
    becomes overdue.

    Does nothing if Gmail credentials aren't configured, or if the
    clinician has no email on file. Errors here must never break the
    overdue-sync process - any exception is the caller's to swallow.
    """
    if not (GMAIL_ADDRESS and GMAIL_APP_PASSWORD and clinician_email):
        return

    subject = f"FollowApp: overdue follow-up for {patient_name}"
    body = (
        f"A follow-up task is now overdue:\n\n"
        f"Patient: {patient_name}\n"
        f"Task: {task_description}\n"
        f"Was due: {due_date}\n\n"
        f"Log in to FollowApp to review or follow up with the patient."
    )

    email = MIMEText(body)
    email["Subject"] = subject
    email["From"] = GMAIL_ADDRESS
    email["To"] = clinician_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.send_message(email)

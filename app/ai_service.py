"""
FollowApp AI service.

Development implementation of the FollowApp AI provider.

The service currently uses a local mock provider because no external
AI API key is configured. The provider interface is designed so that
a real AI provider can be added later without changing the API route
or frontend.
"""

import os
from datetime import datetime

from openai import OpenAI


FOLLOWAPP_AI_SYSTEM_INSTRUCTIONS = """
You are FollowApp AI, a health-information assistant integrated into
a continuity-of-care platform.

Your role is to provide clear, general health information and help
patients understand healthcare concepts and their FollowApp care
information.

You may:
- Explain general health and medical concepts.
- Explain common medical terminology.
- Provide general information about chronic conditions.
- Explain the general purpose of medicines without prescribing.
- Help patients prepare questions for their healthcare professional.
- Provide general healthy-lifestyle and prevention information.

You must not:
- Diagnose a patient.
- Claim that a patient definitely has or does not have a condition.
- Prescribe medication.
- Recommend starting, stopping, or changing medication.
- Recommend medication dose changes.
- Replace assessment by a qualified healthcare professional.
- Provide definitive interpretation of symptoms, tests, or medical results.
- Pretend to have examined the patient.
- Pretend to have access to medical records unless explicitly provided.

Use clear, patient-friendly language and avoid unnecessary medical jargon.
"""


def build_ai_prompt(message: str) -> dict:
    """
    Build the structured prompt that will eventually be sent
    to the real AI provider.
    """

    return {
        "system": FOLLOWAPP_AI_SYSTEM_INSTRUCTIONS.strip(),
        "user": message.strip(),
    }


def generate_mock_response(
    message: str,
    patient_context: dict | None = None,
) -> str:
    """
    Development-only AI provider.

    This simulates useful health-information responses without
    requiring an external AI API.
    """

    text = message.lower().strip()
    if patient_context and "follow-up" in text:
        consultations = patient_context.get("consultations", [])

        if consultations:
            tasks = consultations[-1].get("follow_up_tasks", [])

            if tasks:
                task_lines = "\n".join(
                    f"- {task['description']} (due {task['due_date']})"
                    for task in tasks
                )

                return (
                    "Based on your FollowApp care plan, your current "
                    "follow-up tasks are:\n"
                    f"{task_lines}"
                )
    if "hypertension" in text or "high blood pressure" in text:
        return (
            "Hypertension, commonly called high blood pressure, is a "
            "condition in which blood pressure remains higher than the "
            "recommended range over time. It often causes no noticeable "
            "symptoms, which is why regular blood-pressure checks are "
            "important. Long-term uncontrolled hypertension can increase "
            "the risk of problems involving the heart, brain, kidneys, "
            "and blood vessels. A healthcare professional can assess "
            "your blood-pressure readings and discuss appropriate "
            "management."
        )

    if "diabetes" in text:
        return (
            "Diabetes is a group of conditions in which blood glucose "
            "levels are higher than normal because the body does not "
            "produce enough insulin, does not use insulin effectively, "
            "or both. There are several types of diabetes. Diagnosis "
            "requires clinical assessment and appropriate blood tests. "
            "If you are concerned about diabetes, a healthcare "
            "professional can advise you on appropriate testing."
        )

    if "cholesterol" in text:
        return (
            "Cholesterol is a type of fat-like substance that the body "
            "needs for normal functions. However, certain cholesterol "
            "patterns, particularly higher levels of LDL cholesterol, "
            "can contribute to cardiovascular disease. Cholesterol "
            "levels are usually assessed using a blood test and should "
            "be interpreted together with other cardiovascular risk "
            "factors by a healthcare professional."
        )

    if "medication" in text or "medicine" in text:
        return (
            "Medicines are used for many different purposes, including "
            "treating conditions, controlling symptoms, and reducing "
            "future health risks. The correct medicine and dose depend "
            "on the individual person's circumstances. If you have a "
            "question about a medicine prescribed for you, discuss it "
            "with your healthcare professional or pharmacist."
        )

    return (
        "FollowApp AI is currently operating in development mode. "
        "I can provide general health information, explain medical "
        "terms, and help you prepare questions for your healthcare "
        "professional. I cannot diagnose conditions or prescribe or "
        "change treatment."
    )


def generate_openai_response(message: str, api_key: str) -> str:
    """
    Generate a response using the OpenAI Responses API.

    This function is kept separate from the development provider so
    the application can switch providers without changing the API
    endpoint.
    """

    prompt = build_ai_prompt(message)

    client = OpenAI(api_key=api_key)

    response = client.responses.create(
        model="gpt-5-mini",
        instructions=prompt["system"],
        input=prompt["user"],
    )

    return response.output_text

def build_patient_context(patient) -> dict:
    """
    Build a minimal, read-only AI context from the authenticated patient.

    Only information relevant to continuity of care is included.
    Sensitive authentication and contact information is deliberately
    excluded.
    """

    consultations = []

    for consultation in patient.consultations:
        tasks = []

        for task in consultation.follow_up_tasks:
            tasks.append(
                {
                    "description": task.description,
                    "due_date": (
                        task.due_date.isoformat()
                        if task.due_date
                        else None
                    ),
                    "status": task.status.value
                    if hasattr(task.status, "value")
                    else str(task.status),
                    "requires_clinician_review": bool(
                        task.requires_clinician_review
                    ),
                }
            )

        consultations.append(
            {
                "consultation_date": (
                    consultation.consultation_date.isoformat()
                    if consultation.consultation_date
                    else None
                ),
                "condition": consultation.condition,
                "follow_up_tasks": tasks,
            }
        )

    return {
        "patient_name": patient.full_name,
        "consent_given": bool(patient.consent_given),
        "consultations": consultations,
    }
def generate_ai_response(message: str, patient_context: dict | None = None) -> str:
    """
    Generate a FollowApp AI response.

    If OPENAI_API_KEY is configured, the real provider is used.
    Otherwise, the development/mock provider is used.
    """

    message = message.strip()

    if not message:
        return (
            "Please enter a health question so FollowApp AI can assist you."
        )

    api_key = os.getenv("OPENAI_API_KEY")

    if api_key:
        try:
            return generate_openai_response(message, api_key)
        except Exception:
            return (
                "FollowApp AI is temporarily unavailable. "
                "Please try again shortly or contact your healthcare "
                "professional if you need assistance."
            )

    return generate_mock_response(message, patient_context)
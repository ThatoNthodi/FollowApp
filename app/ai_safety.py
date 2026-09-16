import re


EMERGENCY_PATTERNS = [
    r"\b(chest pain|severe chest pain)\b",
    r"\b(difficulty breathing|trouble breathing|can't breathe|cannot breathe)\b",
    r"\b(unconscious|passed out|not responding)\b",
    r"\b(severe bleeding|bleeding heavily)\b",
    r"\b(seizure|convulsion)\b",
    r"\b(stroke symptoms|signs of stroke)\b",
]


MEDICATION_CHANGE_PATTERNS = [
    r"\b(change my dose|increase my dose|decrease my dose)\b",
    r"\b(double my dose|skip my dose)\b",
    r"\b(stop taking|should i stop)\b.*\b(medicine|medication|tablet|pill)\b",
    r"\b(can i stop|may i stop)\b.*\b(medicine|medication|tablet|pill)\b",
]


DIAGNOSIS_PATTERNS = [
    r"\b(do i have\b)",
    r"\b(am i suffering from\b)",
    r"\b(is this\b).*\b(disease|condition)\b",
    r"\b(what disease do i have)\b",
]


def _matches_any(message: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, message, re.IGNORECASE) for pattern in patterns)


def assess_ai_safety(message: str) -> dict:
    """
    Classify a patient AI question before it is sent to an AI provider.

    This is an initial rule-based safety layer.
    It does not diagnose, prescribe, or determine clinical urgency.
    """

    text = message.strip()

    if not text:
        return {
            "category": "invalid",
            "requires_human_review": False,
            "safe_to_answer": False,
        }

    if _matches_any(text, EMERGENCY_PATTERNS):
        return {
            "category": "possible_emergency",
            "requires_human_review": True,
            "safe_to_answer": False,
        }

    if _matches_any(text, MEDICATION_CHANGE_PATTERNS):
        return {
            "category": "medication_change",
            "requires_human_review": True,
            "safe_to_answer": False,
        }

    if _matches_any(text, DIAGNOSIS_PATTERNS):
        return {
            "category": "diagnosis_request",
            "requires_human_review": True,
            "safe_to_answer": False,
        }

    return {
        "category": "general_information",
        "requires_human_review": False,
        "safe_to_answer": True,
    }

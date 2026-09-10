import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")  # e.g. "whatsapp:+17372508034"

# Twilio error codes that mean "this business-initiated message needs an
# approved template" - the Sandbox only allows a small fixed set of these,
# so we can't send arbitrary text this way without a paid/approved number.
TEMPLATE_REQUIRED_CODES = {21654, 63016}

_client = None


class TemplateRequiredError(Exception):
    """Raised when Twilio rejects a send because a WhatsApp template is
    required (Sandbox limitation, or outside the 24h session on a real
    number)."""
    pass


def get_client() -> Client:
    global _client
    if _client is None:
        if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN):
            raise RuntimeError("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set.")
        _client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    return _client


def normalize_phone(phone: str) -> str:
    """Reduce a phone number to just its last 9 digits, so local ("0821234567")
    and international ("+27821234567" / "whatsapp:+27821234567") forms match."""
    digits = "".join(ch for ch in phone if ch.isdigit())
    return digits[-9:] if len(digits) >= 9 else digits


def send_whatsapp_message(to_phone: str, body: str) -> str:
    """Send a WhatsApp message to a patient's phone number via the Twilio sandbox.
    to_phone is expected in local or international form (e.g. "0821234567").
    Returns the Twilio message SID."""
    if not TWILIO_WHATSAPP_NUMBER:
        raise RuntimeError("TWILIO_WHATSAPP_NUMBER is not set.")

    # Assume South African numbers when no country code is present.
    digits = "".join(ch for ch in to_phone if ch.isdigit())
    if digits.startswith("0"):
        international = "+27" + digits[1:]
    elif to_phone.strip().startswith("+"):
        international = to_phone.strip()
    else:
        international = "+" + digits

    client = get_client()
    try:
        message = client.messages.create(
            from_=TWILIO_WHATSAPP_NUMBER,
            to=f"whatsapp:{international}",
            body=body,
        )
    except TwilioRestException as e:
        if e.code in TEMPLATE_REQUIRED_CODES:
            raise TemplateRequiredError(str(e)) from e
        raise
    return message.sid

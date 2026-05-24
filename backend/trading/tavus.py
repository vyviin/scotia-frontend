import os

import requests
from django.conf import settings

TAVUS_CONVERSATIONS_URL = "https://tavusapi.com/v2/conversations"
REQUEST_TIMEOUT_SECONDS = 20
CONVERSATION_NAME = "iTrade Replay Mentor Demo"


class TavusConfigError(Exception):
    """Raised when required Tavus environment variables are missing."""


class TavusAPIError(Exception):
    """Raised when the Tavus API returns an error or the request fails."""

    def __init__(self, message, status_code=None, response_body=None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class TavusTimeoutError(Exception):
    """Raised when the Tavus API request times out."""


def _get_tavus_config():
    api_key = getattr(settings, "TAVUS_API_KEY", "") or os.environ.get("TAVUS_API_KEY", "")
    replica_id = getattr(settings, "TAVUS_REPLICA_ID", "") or os.environ.get("TAVUS_REPLICA_ID", "")
    persona_id = getattr(settings, "TAVUS_PERSONA_ID", "") or os.environ.get("TAVUS_PERSONA_ID", "")

    missing = []
    if not api_key:
        missing.append("TAVUS_API_KEY")
    if not replica_id:
        missing.append("TAVUS_REPLICA_ID")
    if not persona_id:
        missing.append("TAVUS_PERSONA_ID")

    if missing:
        raise TavusConfigError(f"Missing required Tavus configuration: {', '.join(missing)}")

    return api_key, replica_id, persona_id


def create_tavus_conversation():
    api_key, replica_id, persona_id = _get_tavus_config()

    payload = {
        "replica_id": replica_id,
        "persona_id": persona_id,
        "conversation_name": CONVERSATION_NAME,
        "max_participants": 2,
    }

    try:
        response = requests.post(
            TAVUS_CONVERSATIONS_URL,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.Timeout as exc:
        raise TavusTimeoutError(
            f"Tavus API request timed out after {REQUEST_TIMEOUT_SECONDS} seconds."
        ) from exc
    except requests.RequestException as exc:
        raise TavusAPIError(f"Network error contacting Tavus: {exc}") from exc

    if response.status_code in (401, 403):
        raise TavusAPIError(
            "Tavus authentication failed. Check TAVUS_API_KEY.",
            status_code=response.status_code,
            response_body=response.text,
        )

    if not response.ok:
        detail = response.text.strip() or f"HTTP {response.status_code}"
        raise TavusAPIError(
            f"Tavus API returned {response.status_code}: {detail}",
            status_code=response.status_code,
            response_body=response.text,
        )

    data = response.json()
    return {
        "conversation_id": data.get("conversation_id"),
        "conversation_url": data.get("conversation_url"),
        "status": data.get("status"),
        "raw": data,
    }

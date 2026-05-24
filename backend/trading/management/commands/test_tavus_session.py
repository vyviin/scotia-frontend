from django.core.management.base import BaseCommand

from trading.tavus import (
    TavusAPIError,
    TavusConfigError,
    TavusTimeoutError,
    create_tavus_conversation,
)


class Command(BaseCommand):
    help = "Create a Tavus CVI session and print the conversation URL."

    def handle(self, *args, **options):
        try:
            result = create_tavus_conversation()
        except TavusConfigError:
            self.stderr.write(
                self.style.ERROR(
                    "Tavus is not configured. Set TAVUS_API_KEY, TAVUS_REPLICA_ID, and TAVUS_PERSONA_ID in backend/.env."
                )
            )
            raise SystemExit(1)
        except (TavusAPIError, TavusTimeoutError) as exc:
            self.stderr.write(self.style.ERROR(f"Could not create Tavus conversation: {exc}"))
            raise SystemExit(1)

        conversation_id = result.get("conversation_id")
        conversation_url = result.get("conversation_url")
        status_value = result.get("status")

        if conversation_id:
            self.stdout.write(f"conversation_id: {conversation_id}")
        if conversation_url:
            self.stdout.write(self.style.SUCCESS(f"conversation_url: {conversation_url}"))
        if status_value:
            self.stdout.write(f"status: {status_value}")

        if not conversation_url:
            self.stdout.write("No conversation_url in response. Raw payload:")
            self.stdout.write(str(result.get("raw")))

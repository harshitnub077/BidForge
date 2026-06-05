import posthog
import sentry_sdk
from core.config import settings

def init_telemetry():
    """Initialize PostHog and Sentry telemetry based on env vars."""
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
        )
        print("Sentry initialized.")

    if settings.POSTHOG_API_KEY:
        posthog.project_api_key = settings.POSTHOG_API_KEY
        posthog.host = settings.POSTHOG_HOST
        print("PostHog initialized.")

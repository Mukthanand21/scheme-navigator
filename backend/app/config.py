"""
Configuration module — reads CognoDB credentials from environment variables.
Uses pydantic-settings for validation. Never hardcode credentials.
"""

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# Load .env file (if present) before settings initialization
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    cognodb_uri: str = Field(
        ...,
        description="CognoDB Bolt URI (e.g. bolt+s://your-instance.databases.cognodb.cloud)",
    )
    cognodb_user: str = Field(
        ...,
        description="CognoDB username (typically 'cognodb')",
    )
    cognodb_password: str = Field(
        ...,
        description="CognoDB password",
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


def get_settings() -> Settings:
    """
    Create and return a Settings instance.
    Raises ValidationError with a clear message if any credential is missing.
    """
    try:
        return Settings()  # type: ignore[call-arg]
    except Exception as e:
        raise SystemExit(
            "\n❌ Missing required environment variables.\n"
            "   Set COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD in your .env file.\n"
            "   See .env.example for a template.\n\n"
            f"   Detail: {e}"
        ) from e

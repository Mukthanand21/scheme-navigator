"""
Neo4j/CognoDB driver connection wrapper.
Provides connection management, health checks, and graceful error handling.
"""

from typing import Any

from neo4j import Driver, GraphDatabase
from neo4j.exceptions import AuthError, ServiceUnavailable

from app.config import get_settings


class Neo4jConnection:
    """Wrapper around the Neo4j Python driver for CognoDB."""

    def __init__(self) -> None:
        self._driver: Driver | None = None

    def connect(self) -> None:
        """
        Initialize the Neo4j driver using credentials from environment variables.
        Raises SystemExit on authentication failure.
        """
        settings = get_settings()
        try:
            self._driver = GraphDatabase.driver(
                settings.cognodb_uri,
                auth=(settings.cognodb_user, settings.cognodb_password),
            )
        except AuthError as e:
            raise SystemExit(
                f"\n❌ Authentication failed for CognoDB.\n"
                f"   Check COGNODB_USER and COGNODB_PASSWORD.\n"
                f"   Detail: {e}"
            ) from e

    def close(self) -> None:
        """Close the driver connection and release resources."""
        if self._driver:
            self._driver.close()
            self._driver = None

    @property
    def driver(self) -> Driver:
        """Get the active driver instance. Raises if not connected."""
        if self._driver is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._driver

    def verify_connectivity(self) -> bool:
        """
        Run a simple test query (RETURN 1) to verify the database is reachable.
        Returns True if connected, raises ServiceUnavailable otherwise.
        """
        try:
            with self.driver.session() as session:
                result = session.run("RETURN 1 AS ping")
                record = result.single()
                if record and record["ping"] == 1:
                    print("✅ CognoDB connection verified.")
                    return True
            return False
        except ServiceUnavailable as e:
            print(f"❌ CognoDB unreachable: {e}")
            raise
        except AuthError as e:
            print(f"❌ CognoDB authentication failed: {e}")
            raise

    def execute_read(
        self, query: str, parameters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """Execute a read transaction and return list of record dicts."""
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]

    def execute_write(
        self, query: str, parameters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """Execute a write transaction and return list of record dicts."""
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]


# Module-level singleton
_connection: Neo4jConnection | None = None


def get_db() -> Neo4jConnection:
    """Get or create the module-level database connection singleton."""
    global _connection
    if _connection is None:
        _connection = Neo4jConnection()
        _connection.connect()
    return _connection


def close_db() -> None:
    """Close the module-level database connection."""
    global _connection
    if _connection:
        _connection.close()
        _connection = None

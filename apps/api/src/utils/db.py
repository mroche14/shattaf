"""Database utility functions."""

from uuid import UUID
from sqlalchemy import cast, String


def uuid_hex(uuid_val: UUID) -> str:
    """Convert UUID to hex string for SQLite comparison.

    SQLite stores UUIDs as hex strings without dashes.
    This function converts a UUID to the format SQLite stores it in.
    """
    return uuid_val.hex


def uuid_column_eq(column, uuid_val: UUID):
    """Create a SQLite-compatible UUID column comparison.

    SQLite stores UUIDs as hex strings without dashes, so we need to
    cast the column to string and compare with the hex representation.

    Usage:
        select(User).where(uuid_column_eq(User.id, some_uuid))
    """
    return cast(column, String) == uuid_val.hex

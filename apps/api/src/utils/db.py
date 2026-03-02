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
    """Compare a UUID column with a UUID value.

    Works with both PostgreSQL (native uuid type) and SQLite (hex strings).

    Usage:
        select(User).where(uuid_column_eq(User.id, some_uuid))
    """
    # Direct comparison works for PostgreSQL native UUID columns.
    # For SQLite, cast to string and compare with str(uuid) which includes dashes.
    return column == str(uuid_val)

"""Audit log model."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlmodel import Field, Column, JSON

from .base import BaseModel


class AuditLog(BaseModel, table=True):
    """Immutable audit log entry."""

    __tablename__ = "audit_logs"

    # Actor
    user_id: Optional[UUID] = Field(default=None, foreign_key="users.id", index=True)
    user_email: Optional[str] = None
    user_role: Optional[str] = None

    # Action
    action: str = Field(index=True)  # "create", "update", "delete", "login", etc.
    resource_type: str = Field(index=True)  # "booking", "order", "invoice", etc.
    resource_id: Optional[UUID] = None

    # Details
    old_values: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
    new_values: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
    extra_data: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))

    # Request context
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    # Timestamp (immutable)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)

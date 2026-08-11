import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id: Mapped[str] = mapped_column(String, ForeignKey("runs.id"), nullable=False, index=True)
    event_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    run = relationship("Run", back_populates="activities")

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    supervisor_id: Mapped[str] = mapped_column(String, ForeignKey("supervisors.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="STARTING", index=True)
    order_context: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    memory_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    next_wake_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    final_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    learnings: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    supervisor = relationship("Supervisor", back_populates="runs")
    activities = relationship("Activity", back_populates="run", cascade="all, delete-orphan", order_by="Activity.created_at")

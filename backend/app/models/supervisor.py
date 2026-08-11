import uuid
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy import String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Supervisor(Base):
    __tablename__ = "supervisors"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    base_instruction: Mapped[str] = mapped_column(Text, nullable=False)
    available_actions: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)
    wake_policy: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    model_config_settings: Mapped[Dict[str, Any]] = mapped_column("model_config", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    runs = relationship("Run", back_populates="supervisor", cascade="all, delete-orphan")

from enum import Enum
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class WorkflowState(str, Enum):
    STARTING = "STARTING"
    START_FAILED = "START_FAILED"
    ACTIVE = "ACTIVE"
    SLEEPING = "SLEEPING"
    PAUSED = "PAUSED"
    INTERRUPTED = "INTERRUPTED"
    COMPLETING = "COMPLETING"
    COMPLETED = "COMPLETED"
    TERMINATED = "TERMINATED"

class RunCreate(BaseModel):
    order_id: str = Field(..., description="Unique order identifier")
    supervisor_id: str = Field(..., description="ID of supervisor handling this run")
    order_context: Dict[str, Any] = Field(default_factory=dict, description="Initial order details")

class RunResponse(BaseModel):
    id: str
    order_id: str
    supervisor_id: str
    status: WorkflowState
    order_context: Dict[str, Any]
    memory_summary: str = ""
    next_wake_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    final_summary: Optional[str] = None
    learnings: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None

    class Config:
        from_attributes = True

class TimelineItem(BaseModel):
    timestamp: datetime
    type: str  # event, agent_decision, action, state_change
    description: str
    details: Dict[str, Any] = Field(default_factory=dict)

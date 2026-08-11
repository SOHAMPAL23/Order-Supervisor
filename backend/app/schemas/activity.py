from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ActivityCreate(BaseModel):
    run_id: str
    event_id: Optional[str] = None
    type: str = Field(..., description="Activity type: e.g., action, event_received, decision, memory_update")
    action: Optional[str] = Field(None, description="Action name if type is action")
    payload: Dict[str, Any] = Field(default_factory=dict)

class ActivityResponse(BaseModel):
    id: str
    run_id: str
    event_id: Optional[str] = None
    type: str
    action: Optional[str] = None
    payload: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

from enum import Enum
from typing import Literal, List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.schemas.event import OrderEvent

class ActionType(str, Enum):
    MESSAGE_FULFILLMENT_TEAM = "message_fulfillment_team"
    MESSAGE_PAYMENTS_TEAM = "message_payments_team"
    MESSAGE_LOGISTICS_TEAM = "message_logistics_team"
    MESSAGE_CUSTOMER = "message_customer"
    CREATE_INTERNAL_NOTE = "create_internal_note"

class AgentAction(BaseModel):
    action_id: Optional[str] = Field(None, description="Optional action id for idempotency tracking")
    action_type: ActionType = Field(..., description="The action to be executed")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Parameters/payload for the action")

class AgentDecision(BaseModel):
    decision: Literal["ACT", "SLEEP", "COMPLETE"] = Field(..., description="The decision of the agent")
    reason: str = Field(..., description="Explanation/rationale behind the decision")
    actions: List[AgentAction] = Field(default_factory=list, description="List of actions to take if decision is ACT")
    memory_update: Optional[str] = Field(None, description="Updated compact memory summary")
    wake_after_seconds: Optional[int] = Field(None, description="Seconds to sleep before next scheduled wake-up")

class AgentContext(BaseModel):
    order_id: str
    run_id: str
    order_context: Dict[str, Any]
    supervisor_config: Dict[str, Any]
    run_instructions: List[str] = Field(default_factory=list)
    current_status: str
    recent_events: List[OrderEvent] = Field(default_factory=list)
    activity_history: List[Dict[str, Any]] = Field(default_factory=list)
    compact_memory: str = ""

class WakeDecision(BaseModel):
    should_wake: bool
    priority: str = Field("NORMAL", description="HIGH, NORMAL, TERMINAL, IGNORE")
    reason: str

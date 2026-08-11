from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class EventType(str, Enum):
    ORDER_CREATED = "order_created"
    PAYMENT_CONFIRMED = "payment_confirmed"
    PAYMENT_FAILED = "payment_failed"
    SHIPMENT_CREATED = "shipment_created"
    SHIPMENT_DELAYED = "shipment_delayed"
    DELIVERED = "delivered"
    REFUND_REQUESTED = "refund_requested"
    CUSTOMER_MESSAGE_RECEIVED = "customer_message_received"
    NO_UPDATE_FOR_N_HOURS = "no_update_for_n_hours"
    MANUAL_INSTRUCTION = "manual_instruction"

class OrderEvent(BaseModel):
    event_id: str = Field(..., description="Unique event identifier for idempotency")
    event_type: str = Field(..., description="Type of order lifecycle event")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when event occurred")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Event metadata/payload")
    source: str = Field(default="system", description="Source of the event, e.g., simulator, webhook, admin")

class AddInstructionPayload(BaseModel):
    instruction: str = Field(..., description="Manual instruction injected by user/admin")
    added_by: str = Field(default="user", description="Who added the instruction")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SupervisorBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), populate_by_name=True, from_attributes=True)

    name: str = Field(..., description="Unique or descriptive name for the supervisor")
    base_instruction: str = Field(..., description="System instructions/prompt template for supervisor AI")
    available_actions: List[str] = Field(
        default_factory=lambda: [
            "message_fulfillment_team",
            "message_payments_team",
            "message_logistics_team",
            "message_customer",
            "create_internal_note"
        ],
        description="Actions enabled for this supervisor"
    )
    wake_policy: Dict[str, Any] = Field(
        default_factory=lambda: {"type": "rule_based"},
        description="Configuration for wake policy evaluation"
    )
    model_config_settings: Dict[str, Any] = Field(
        default_factory=lambda: {"model": "gpt-4o", "temperature": 0.2},
        alias="model_config",
        description="LLM provider configuration settings"
    )

class SupervisorCreate(SupervisorBase):
    pass

class SupervisorUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), populate_by_name=True)

    name: Optional[str] = None
    base_instruction: Optional[str] = None
    available_actions: Optional[List[str]] = None
    wake_policy: Optional[Dict[str, Any]] = None
    model_config_settings: Optional[Dict[str, Any]] = Field(None, alias="model_config")

class SupervisorResponse(SupervisorBase):
    id: str
    created_at: datetime
    updated_at: datetime


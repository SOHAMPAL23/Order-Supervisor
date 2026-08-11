from typing import Protocol
from app.schemas.agent import WakeDecision
from app.schemas.event import EventType

class WakePolicy(Protocol):
    def should_wake(self, event_type: str, current_state: str) -> WakeDecision:
        ...

class RuleBasedWakePolicy:
    """Deterministic rule-based wake policy implementation."""
    
    HIGH_PRIORITY_EVENTS = {
        EventType.PAYMENT_FAILED.value,
        EventType.SHIPMENT_DELAYED.value,
        EventType.REFUND_REQUESTED.value,
        EventType.CUSTOMER_MESSAGE_RECEIVED.value
    }
    
    NORMAL_PRIORITY_EVENTS = {
        EventType.PAYMENT_CONFIRMED.value,
        EventType.SHIPMENT_CREATED.value,
        EventType.NO_UPDATE_FOR_N_HOURS.value,
        EventType.MANUAL_INSTRUCTION.value
    }
    
    TERMINAL_EVENTS = {
        EventType.DELIVERED.value
    }

    def should_wake(self, event_type: str, current_state: str) -> WakeDecision:
        if event_type in self.TERMINAL_EVENTS:
            return WakeDecision(
                should_wake=True,
                priority="TERMINAL",
                reason=f"Terminal event '{event_type}' received. Immediate finalization required."
            )
            
        if event_type in self.HIGH_PRIORITY_EVENTS:
            return WakeDecision(
                should_wake=True,
                priority="HIGH",
                reason=f"High priority event '{event_type}' requires immediate agent evaluation."
            )

        if event_type in self.NORMAL_PRIORITY_EVENTS:
            return WakeDecision(
                should_wake=True,
                priority="NORMAL",
                reason=f"Normal event '{event_type}' processed for order progression."
            )

        return WakeDecision(
            should_wake=False,
            priority="IGNORE",
            reason=f"Event '{event_type}' does not meet immediate wake threshold."
        )

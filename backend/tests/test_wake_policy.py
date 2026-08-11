import pytest
from app.agent.wake_policy import RuleBasedWakePolicy
from app.schemas.event import EventType

def test_wake_policy_high_priority():
    policy = RuleBasedWakePolicy()
    
    high_events = [
        EventType.PAYMENT_FAILED.value,
        EventType.SHIPMENT_DELAYED.value,
        EventType.REFUND_REQUESTED.value,
        EventType.CUSTOMER_MESSAGE_RECEIVED.value
    ]
    
    for event_type in high_events:
        decision = policy.should_wake(event_type, "ACTIVE")
        assert decision.should_wake is True
        assert decision.priority == "HIGH"

def test_wake_policy_normal_priority():
    policy = RuleBasedWakePolicy()
    
    normal_events = [
        EventType.PAYMENT_CONFIRMED.value,
        EventType.SHIPMENT_CREATED.value,
        EventType.NO_UPDATE_FOR_N_HOURS.value,
        EventType.MANUAL_INSTRUCTION.value
    ]
    
    for event_type in normal_events:
        decision = policy.should_wake(event_type, "ACTIVE")
        assert decision.should_wake is True
        assert decision.priority == "NORMAL"

def test_wake_policy_terminal():
    policy = RuleBasedWakePolicy()
    decision = policy.should_wake(EventType.DELIVERED.value, "ACTIVE")
    assert decision.should_wake is True
    assert decision.priority == "TERMINAL"

def test_wake_policy_unknown_event():
    policy = RuleBasedWakePolicy()
    decision = policy.should_wake("random_unknown_event", "ACTIVE")
    assert decision.should_wake is False
    assert decision.priority == "IGNORE"

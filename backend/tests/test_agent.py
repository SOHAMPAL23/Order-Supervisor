import pytest
from unittest.mock import AsyncMock
from app.agent.runtime import AgentRuntime
from app.agent.llm import FallbackLLMProvider
from app.schemas.agent import AgentContext
from app.schemas.event import OrderEvent, EventType

@pytest.mark.asyncio
async def test_fallback_llm_provider_decisions():
    provider = FallbackLLMProvider()
    
    # Test payment failed event -> ACT
    ctx_payment_failed = AgentContext(
        order_id="ORD-100",
        run_id="run-1",
        order_context={"amount": 150},
        supervisor_config={"name": "test_sup"},
        current_status="ACTIVE",
        recent_events=[OrderEvent(event_id="e1", event_type=EventType.PAYMENT_FAILED.value)],
        activity_history=[],
        compact_memory="New order"
    )
    decision = await provider.decide(ctx_payment_failed)
    assert decision.decision == "ACT"
    assert len(decision.actions) > 0

    # Test shipment delayed event -> ACT
    ctx_delayed = AgentContext(
        order_id="ORD-100",
        run_id="run-1",
        order_context={},
        supervisor_config={},
        current_status="ACTIVE",
        recent_events=[OrderEvent(event_id="e2", event_type=EventType.SHIPMENT_DELAYED.value)],
        activity_history=[],
        compact_memory=""
    )
    decision_delayed = await provider.decide(ctx_delayed)
    assert decision_delayed.decision == "ACT"

    # Test delivered event -> COMPLETE
    ctx_delivered = AgentContext(
        order_id="ORD-100",
        run_id="run-1",
        order_context={},
        supervisor_config={},
        current_status="ACTIVE",
        recent_events=[OrderEvent(event_id="e3", event_type=EventType.DELIVERED.value)],
        activity_history=[],
        compact_memory=""
    )
    decision_del = await provider.decide(ctx_delivered)
    assert decision_del.decision == "COMPLETE"

@pytest.mark.asyncio
async def test_agent_runtime_llm_failure_recovery():
    # Mock primary LLM provider throwing error
    failing_provider = AsyncMock()
    failing_provider.decide.side_effect = Exception("LLM connection timeout")
    
    runtime = AgentRuntime(provider=failing_provider)
    
    ctx = AgentContext(
        order_id="ORD-200",
        run_id="run-2",
        order_context={},
        supervisor_config={},
        current_status="ACTIVE",
        recent_events=[],
        activity_history=[],
        compact_memory=""
    )
    
    # Evaluate should not throw; it catches error and returns safe fallback
    decision = await runtime.evaluate(ctx)
    assert decision is not None
    assert "SAFE FALLBACK" in decision.reason or "KEEPING WORKFLOW ALIVE" in decision.reason.upper()

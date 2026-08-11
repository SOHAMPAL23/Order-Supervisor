from unittest.mock import AsyncMock
import pytest
from app.temporal.workflows.order_supervisor import OrderSupervisorWorkflow

@pytest.mark.asyncio
async def test_workflow_state_queries_and_signals():
    wf = OrderSupervisorWorkflow()
    wf.order_id = "ORD-TEST-1"
    wf.run_id = "run-test-1"
    
    # Test initial queries
    assert wf.get_state() == "STARTING"
    assert wf.get_memory() == "Initial order supervisor started."
    
    # Test pause signal
    await wf.pause()
    assert wf.get_state() == "PAUSED"
    
    # Test resume signal
    wf.state = "PAUSED"
    # Overriding internal evaluate to avoid activity call during pure unit test
    wf._evaluate_and_run_agent = AsyncMock()
    await wf.resume()
    assert wf.get_state() == "ACTIVE"
    
    # Test order_event signal enqueueing
    event_payload = {"event_id": "e_99", "event_type": "shipment_delayed", "source": "test"}
    wf._log_activity = AsyncMock()
    await wf.order_event(event_payload)
    assert len(wf.events_queue) == 1
    assert wf.events_queue[0]["event_id"] == "e_99"

    # Test add_instruction signal
    await wf.add_instruction({"instruction": "Expedite replacement shipping"})
    assert len(wf.run_instructions) == 1
    assert wf.run_instructions[0] == "Expedite replacement shipping"

    # Test terminate signal
    await wf.terminate(reason="User cancelled order")
    assert wf.get_state() == "TERMINATED"
    assert wf.is_terminal is True

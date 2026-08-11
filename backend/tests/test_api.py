import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_supervisor_crud(async_client: AsyncClient):
    # Create supervisor
    payload = {
        "name": "ECommerce Tier 1 Supervisor",
        "base_instruction": "Supervise all order fulfillment steps closely.",
        "available_actions": ["message_logistics_team", "message_customer"],
        "wake_policy": {"type": "rule_based"},
        "model_config": {"model": "gpt-4o", "temperature": 0.2}
    }
    response = await async_client.post("/api/supervisors", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == payload["name"]
    sup_id = data["data"]["id"]

    # Get supervisor
    get_res = await async_client.get(f"/api/supervisors/{sup_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == sup_id

    # List supervisors
    list_res = await async_client.get("/api/supervisors")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

@pytest.mark.asyncio
async def test_run_creation_and_lifecycle(async_client: AsyncClient):
    # First create a supervisor
    sup_res = await async_client.post("/api/supervisors", json={
        "name": "Lifecycle Test Supervisor",
        "base_instruction": "Monitor lifecycle.",
        "available_actions": ["create_internal_note"],
        "wake_policy": {},
        "model_config": {}
    })
    sup_id = sup_res.json()["data"]["id"]

    # Create run
    run_res = await async_client.post("/api/runs", json={
        "order_id": "ORD-LIFE-100",
        "supervisor_id": sup_id,
        "order_context": {"customer_id": "CUST-1", "items": ["Item A"]}
    })
    assert run_res.status_code == 201
    run_data = run_res.json()["data"]
    run_id = run_data["id"]
    assert run_data["order_id"] == "ORD-LIFE-100"

    # Inject event
    event_res = await async_client.post(f"/api/runs/{run_id}/events", json={
        "event_id": "evt_ship_delay_1",
        "event_type": "shipment_delayed",
        "payload": {"reason": "weather"},
        "source": "simulator"
    })
    assert event_res.status_code == 200
    assert event_res.json()["success"] is True

    # Inject instruction
    inst_res = await async_client.post(f"/api/runs/{run_id}/instructions", json={
        "instruction": "Priority handling for order",
        "added_by": "admin"
    })
    assert inst_res.status_code == 200
    assert inst_res.json()["success"] is True

    # Pause run
    pause_res = await async_client.post(f"/api/runs/{run_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["data"]["status"] == "PAUSED"

    # Resume run
    resume_res = await async_client.post(f"/api/runs/{run_id}/resume")
    assert resume_res.status_code == 200
    assert resume_res.json()["data"]["status"] == "ACTIVE"

    # Query timeline, activities, memory
    tl_res = await async_client.get(f"/api/runs/{run_id}/timeline")
    assert tl_res.status_code == 200
    assert len(tl_res.json()["data"]) >= 2

    act_res = await async_client.get(f"/api/runs/{run_id}/activities")
    assert act_res.status_code == 200

    mem_res = await async_client.get(f"/api/runs/{run_id}/memory")
    assert mem_res.status_code == 200

    # Terminate run
    term_res = await async_client.post(f"/api/runs/{run_id}/terminate", json={"reason": "Test finished"})
    assert term_res.status_code == 200
    assert term_res.json()["data"]["status"] == "TERMINATED"

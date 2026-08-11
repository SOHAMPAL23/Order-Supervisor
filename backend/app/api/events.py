import uuid
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.response import APIResponse
from app.schemas.event import OrderEvent, AddInstructionPayload
from app.schemas.activity import ActivityCreate
from app.repositories.run_repo import run_repo
from app.repositories.activity_repo import activity_repo
from app.temporal.client import get_temporal_client
from app.config import settings

router = APIRouter(prefix="/runs", tags=["Events & Instructions"])

@router.post("/{run_id}/events", response_model=APIResponse[Dict[str, Any]])
async def inject_event(
    run_id: str,
    event: OrderEvent,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' not found.")

    if run.status in ["COMPLETED", "TERMINATED"]:
        return APIResponse.fail(
            code="RUN_TERMINATED",
            message=f"Cannot inject events into run {run_id} which is in terminal state '{run.status}'."
        )

    # Log incoming event in database activities
    await activity_repo.create(db, ActivityCreate(
        run_id=run_id,
        event_id=event.event_id,
        type="event_injected",
        action=None,
        payload=event.model_dump(mode="json")
    ))

    # Signal Temporal Workflow (Requirement 5)
    workflow_id = f"order-supervisor-{run.order_id}"
    try:
        client = await get_temporal_client()
        handle = client.get_workflow_handle(workflow_id)
        await handle.signal("order_event", event.model_dump(mode="json"))
    except Exception as e:
        err_msg = str(e).lower()
        if "completed" in err_msg or "closed" in err_msg or "not found" in err_msg:
            await run_repo.update_status(db, run_id, "COMPLETED")
            return APIResponse.fail(
                code="WORKFLOW_ALREADY_COMPLETED",
                message=f"Event logged in DB, but Temporal workflow '{workflow_id}' has already completed. Database run status updated to COMPLETED."
            )
        return APIResponse.fail(
            code="TEMPORAL_SIGNAL_ERROR",
            message=f"Event logged in DB, but failed to signal Temporal workflow: {str(e)}"
        )

    return APIResponse.ok({
        "run_id": run_id,
        "order_id": run.order_id,
        "event_id": event.event_id,
        "event_type": event.event_type,
        "status": "signaled_to_workflow"
    })

@router.post("/{run_id}/instructions", response_model=APIResponse[Dict[str, Any]])
async def add_instruction(
    run_id: str,
    payload: AddInstructionPayload,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' not found.")

    if run.status in ["COMPLETED", "TERMINATED"]:
        return APIResponse.fail(
            code="RUN_TERMINATED",
            message=f"Cannot add instructions to run {run_id} which is in terminal state '{run.status}'."
        )

    # Record activity in DB
    await activity_repo.create(db, ActivityCreate(
        run_id=run_id,
        event_id=f"inst_{uuid.uuid4().hex[:8]}",
        type="instruction_added",
        action=None,
        payload=payload.model_dump(mode="json")
    ))

    # Signal Temporal Workflow
    workflow_id = f"order-supervisor-{run.order_id}"
    try:
        client = await get_temporal_client()
        handle = client.get_workflow_handle(workflow_id)
        await handle.signal("add_instruction", payload.model_dump(mode="json"))
    except Exception as e:
        err_msg = str(e).lower()
        if "completed" in err_msg or "closed" in err_msg or "not found" in err_msg:
            await run_repo.update_status(db, run_id, "COMPLETED")
            return APIResponse.fail(
                code="WORKFLOW_ALREADY_COMPLETED",
                message=f"Instruction recorded in DB, but Temporal workflow '{workflow_id}' has already completed. Database run status updated to COMPLETED."
            )
        return APIResponse.fail(
            code="TEMPORAL_SIGNAL_ERROR",
            message=f"Instruction recorded in DB, but failed to signal Temporal workflow: {str(e)}"
        )

    return APIResponse.ok({
        "run_id": run_id,
        "instruction": payload.instruction,
        "added_by": payload.added_by,
        "status": "signaled_to_workflow"
    })

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.response import APIResponse
from app.schemas.run import RunCreate, RunResponse, TimelineItem
from app.schemas.activity import ActivityResponse
from app.repositories.run_repo import run_repo
from app.repositories.supervisor_repo import supervisor_repo
from app.repositories.activity_repo import activity_repo
from app.temporal.client import get_temporal_client
from app.temporal.workflows.order_supervisor import OrderSupervisorWorkflow
from app.config import settings

router = APIRouter(prefix="/runs", tags=["Runs"])

@router.post("", response_model=APIResponse[RunResponse], status_code=status.HTTP_201_CREATED)
async def create_run(
    payload: RunCreate,
    db: AsyncSession = Depends(get_db)
):
    supervisor = await supervisor_repo.get_by_id(db, payload.supervisor_id)
    if not supervisor:
        return APIResponse.fail(
            code="SUPERVISOR_NOT_FOUND",
            message=f"Supervisor with ID '{payload.supervisor_id}' was not found."
        )

    # Check if active run exists for order
    existing_run = await run_repo.get_by_order_id(db, payload.order_id)
    if existing_run and existing_run.status not in ["COMPLETED", "TERMINATED"]:
        return APIResponse.fail(
            code="RUN_ALREADY_EXISTS",
            message=f"An active run ({existing_run.id}) already exists for order '{payload.order_id}'."
        )

    # Create run record in database
    run = await run_repo.create(db, payload)

    # Start long-running Temporal workflow (Requirement 3: one workflow per order)
    workflow_id = f"order-supervisor-{payload.order_id}"
    try:
        client = await get_temporal_client()
        await client.start_workflow(
            OrderSupervisorWorkflow.run,
            {
                "order_id": payload.order_id,
                "run_id": run.id,
                "supervisor_config": {
                    "id": supervisor.id,
                    "name": supervisor.name,
                    "base_instruction": supervisor.base_instruction,
                    "available_actions": supervisor.available_actions,
                    "model_config": supervisor.model_config_settings
                },
                "order_context": payload.order_context
            },
            id=workflow_id,
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )
    except Exception as e:
        # If temporal server is offline or fails to start, record error but return created run info
        await run_repo.update_status(db, run.id, "START_FAILED")
        return APIResponse.fail(
            code="TEMPORAL_START_ERROR",
            message=f"Run created in DB, but failed to start Temporal workflow '{workflow_id}': {str(e)}"
        )

    return APIResponse.ok(RunResponse.model_validate(run))

@router.get("", response_model=APIResponse[List[RunResponse]])
async def list_runs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    runs = await run_repo.list_all(db, skip=skip, limit=limit)
    return APIResponse.ok([RunResponse.model_validate(r) for r in runs])

@router.get("/{run_id}", response_model=APIResponse[RunResponse])
async def get_run(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")
    return APIResponse.ok(RunResponse.model_validate(run))

@router.get("/{run_id}/timeline", response_model=APIResponse[List[TimelineItem]])
async def get_run_timeline(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")

    activities = await activity_repo.list_by_run(db, run_id)
    timeline = []
    for act in activities:
        timeline.append(TimelineItem(
            timestamp=act.created_at,
            type=act.type,
            description=f"Activity: {act.type}" + (f" ({act.action})" if act.action else ""),
            details=act.payload
        ))
    return APIResponse.ok(timeline)

@router.get("/{run_id}/activities", response_model=APIResponse[List[ActivityResponse]])
async def get_run_activities(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")

    activities = await activity_repo.list_by_run(db, run_id)
    return APIResponse.ok([ActivityResponse.model_validate(a) for a in activities])

@router.get("/{run_id}/memory", response_model=APIResponse[Dict[str, Any]])
async def get_run_memory(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")

    workflow_id = f"order-supervisor-{run.order_id}"
    temporal_memory = run.memory_summary
    try:
        client = await get_temporal_client()
        handle = client.get_workflow_handle(workflow_id)
        temporal_memory = await handle.query("get_memory")
    except Exception:
        pass

    return APIResponse.ok({
        "run_id": run_id,
        "order_id": run.order_id,
        "compact_memory": temporal_memory
    })

# Lifecycle controls (Requirement 5 & Requirement 18)
@router.post("/{run_id}/pause", response_model=APIResponse[Dict[str, Any]])
async def pause_run(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")

    workflow_id = f"order-supervisor-{run.order_id}"
    try:
        client = await get_temporal_client()
        handle = client.get_workflow_handle(workflow_id)
        await handle.signal("pause")
    except Exception as e:
        err_msg = str(e).lower()
        if "completed" in err_msg or "closed" in err_msg or "not found" in err_msg:
            await run_repo.update_status(db, run_id, "COMPLETED")
            return APIResponse.fail(code="WORKFLOW_ALREADY_COMPLETED", message=f"Temporal workflow '{workflow_id}' is already completed. Database run status updated to COMPLETED.")
        return APIResponse.fail(code="SIGNAL_FAILED", message=f"Failed to send pause signal: {str(e)}")

    await run_repo.update_status(db, run_id, "PAUSED")
    return APIResponse.ok({"run_id": run_id, "status": "PAUSED"})

@router.post("/{run_id}/resume", response_model=APIResponse[Dict[str, Any]])
async def resume_run(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")

    workflow_id = f"order-supervisor-{run.order_id}"
    try:
        client = await get_temporal_client()
        handle = client.get_workflow_handle(workflow_id)
        await handle.signal("resume")
    except Exception as e:
        err_msg = str(e).lower()
        if "completed" in err_msg or "closed" in err_msg or "not found" in err_msg:
            await run_repo.update_status(db, run_id, "COMPLETED")
            return APIResponse.fail(code="WORKFLOW_ALREADY_COMPLETED", message=f"Temporal workflow '{workflow_id}' is already completed. Database run status updated to COMPLETED.")
        return APIResponse.fail(code="SIGNAL_FAILED", message=f"Failed to send resume signal: {str(e)}")

    await run_repo.update_status(db, run_id, "ACTIVE")
    return APIResponse.ok({"run_id": run_id, "status": "ACTIVE"})

@router.post("/{run_id}/interrupt", response_model=APIResponse[Dict[str, Any]])
async def interrupt_run(
    run_id: str,
    reason: str = "Manual API interrupt",
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")

    workflow_id = f"order-supervisor-{run.order_id}"
    try:
        client = await get_temporal_client()
        handle = client.get_workflow_handle(workflow_id)
        await handle.signal("interrupt", reason)
    except Exception as e:
        err_msg = str(e).lower()
        if "completed" in err_msg or "closed" in err_msg or "not found" in err_msg:
            await run_repo.update_status(db, run_id, "COMPLETED")
            return APIResponse.fail(code="WORKFLOW_ALREADY_COMPLETED", message=f"Temporal workflow '{workflow_id}' is already completed. Database run status updated to COMPLETED.")
        return APIResponse.fail(code="SIGNAL_FAILED", message=f"Failed to send interrupt signal: {str(e)}")

    await run_repo.update_status(db, run_id, "INTERRUPTED")
    return APIResponse.ok({"run_id": run_id, "status": "INTERRUPTED", "reason": reason})

@router.post("/{run_id}/terminate", response_model=APIResponse[Dict[str, Any]])
async def terminate_run(
    run_id: str,
    reason: str = "Manual API termination",
    db: AsyncSession = Depends(get_db)
):
    run = await run_repo.get_by_id(db, run_id)
    if not run:
        return APIResponse.fail(code="RUN_NOT_FOUND", message=f"Run with ID '{run_id}' was not found.")

    workflow_id = f"order-supervisor-{run.order_id}"
    try:
        client = await get_temporal_client()
        handle = client.get_workflow_handle(workflow_id)
        await handle.signal("terminate", reason)
    except Exception as e:
        err_msg = str(e).lower()
        if "completed" in err_msg or "closed" in err_msg or "not found" in err_msg:
            await run_repo.update_status(db, run_id, "COMPLETED")
            return APIResponse.fail(code="WORKFLOW_ALREADY_COMPLETED", message=f"Temporal workflow '{workflow_id}' is already completed. Database run status updated to COMPLETED.")
        return APIResponse.fail(code="SIGNAL_FAILED", message=f"Failed to send terminate signal: {str(e)}")

    await run_repo.update_status(db, run_id, "TERMINATED")
    return APIResponse.ok({"run_id": run_id, "status": "TERMINATED", "reason": reason})

from typing import Dict, Any, Optional
from datetime import datetime
from temporalio import activity

from app.schemas.agent import AgentContext, AgentDecision, AgentAction
from app.schemas.activity import ActivityCreate, ActivityResponse
from app.schemas.event import OrderEvent
from app.agent.runtime import AgentRuntime
from app.tools.actions import execute_business_action
from app.db.session import SyncSessionLocal
from app.models.run import Run
from app.models.activity import Activity

@activity.defn
async def run_agent_activity(context_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Execute AI Agent inference with context and safe error handling."""
    activity.logger.info(f"Running agent activity for run {context_dict.get('run_id')}")
    try:
        context = AgentContext(**context_dict)
        runtime = AgentRuntime()
        decision = await runtime.evaluate(context)
        return decision.model_dump()
    except Exception as e:
        activity.logger.error(f"Error in run_agent_activity: {e}")
        # Safe fallback decision
        fallback = AgentDecision(
            decision="SLEEP",
            reason=f"Agent execution encountered an exception: {str(e)}. Safe fallback applied.",
            actions=[],
            memory_update=None,
            wake_after_seconds=300
        )
        return fallback.model_dump()

@activity.defn
async def execute_action_activity(params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a simulated business action tool and record activity."""
    run_id = params["run_id"]
    action_dict = params["action"]
    action = AgentAction(**action_dict)
    
    activity.logger.info(f"Executing action {action.action_type} for run {run_id}")
    result = await execute_business_action(run_id, action)
    
    # Persist activity in database synchronously inside activity thread
    with SyncSessionLocal() as session:
        act = Activity(
            run_id=run_id,
            event_id=action.action_id,
            type="action",
            action=action.action_type.value,
            payload={
                "input": action.payload,
                "output": result
            }
        )
        session.add(act)
        session.commit()
        
    return result

@activity.defn
async def persist_activity_log(activity_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Persist an activity log record to Postgres."""
    data = ActivityCreate(**activity_dict)
    with SyncSessionLocal() as session:
        act = Activity(
            run_id=data.run_id,
            event_id=data.event_id,
            type=data.type,
            action=data.action,
            payload=data.payload
        )
        session.add(act)
        session.commit()
        session.refresh(act)
        return {
            "id": act.id,
            "run_id": act.run_id,
            "event_id": act.event_id,
            "type": act.type,
            "action": act.action,
            "payload": act.payload,
            "created_at": act.created_at.isoformat()
        }

@activity.defn
async def update_memory_activity(params: Dict[str, Any]) -> None:
    """Update compact memory summary for a run in DB."""
    run_id = params["run_id"]
    memory_summary = params["memory_summary"]
    with SyncSessionLocal() as session:
        run = session.query(Run).filter(Run.id == run_id).first()
        if run:
            run.memory_summary = memory_summary
            run.updated_at = datetime.utcnow()
            session.commit()

@activity.defn
async def update_run_status_activity(params: Dict[str, Any]) -> None:
    """Update run status and next_wake_at in DB."""
    run_id = params["run_id"]
    status = params["status"]
    next_wake_at_iso = params.get("next_wake_at")
    
    next_wake_at = datetime.fromisoformat(next_wake_at_iso) if next_wake_at_iso else None
    
    with SyncSessionLocal() as session:
        run = session.query(Run).filter(Run.id == run_id).first()
        if run:
            run.status = status
            run.next_wake_at = next_wake_at
            run.updated_at = datetime.utcnow()
            session.commit()

@activity.defn
async def generate_final_summary_activity(context_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Generate final summary, learnings, and recommendations for completed run."""
    run_id = context_dict["run_id"]
    context = AgentContext(**context_dict)
    
    # Synthesize final summary
    final_summary = f"Order {context.order_id} supervision finalized. Status: {context.current_status}. Memory: {context.compact_memory}"
    learnings = [
        f"Processed {len(context.recent_events)} events during workflow run.",
        f"Executed {len(context.activity_history)} activities for order supervisor."
    ]
    recommendations = [
        "Review logistics carrier response times for future orders.",
        "Ensure payment webhook retries are enabled."
    ]
    
    now = datetime.utcnow()
    with SyncSessionLocal() as session:
        run = session.query(Run).filter(Run.id == run_id).first()
        if run:
            run.status = "COMPLETED"
            run.final_summary = final_summary
            run.learnings = learnings
            run.recommendations = recommendations
            run.completed_at = now
            run.updated_at = now
            session.commit()
            
    return {
        "final_summary": final_summary,
        "learnings": learnings,
        "recommendations": recommendations,
        "completed_at": now.isoformat()
    }

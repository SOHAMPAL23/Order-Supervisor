from typing import Dict, Any
from app.schemas.agent import AgentAction, ActionType

async def execute_business_action(run_id: str, action: AgentAction) -> Dict[str, Any]:
    """Execute simulated business action tools.
    
    Required Business Actions (Requirement 11):
    - message_fulfillment_team
    - message_payments_team
    - message_logistics_team
    - message_customer
    - create_internal_note
    """
    action_type = action.action_type
    payload = action.payload

    if action_type == ActionType.MESSAGE_FULFILLMENT_TEAM:
        return {
            "type": "action",
            "action": action_type.value,
            "payload": payload,
            "result": "simulated_success",
            "details": f"Fulfillment team notified for run {run_id}: {payload.get('message', 'No details')}"
        }

    elif action_type == ActionType.MESSAGE_PAYMENTS_TEAM:
        return {
            "type": "action",
            "action": action_type.value,
            "payload": payload,
            "result": "simulated_success",
            "details": f"Payments team notified for run {run_id}: {payload.get('message', 'No details')}"
        }

    elif action_type == ActionType.MESSAGE_LOGISTICS_TEAM:
        return {
            "type": "action",
            "action": action_type.value,
            "payload": payload,
            "result": "simulated_success",
            "details": f"Logistics team notified for run {run_id}: {payload.get('message', 'No details')}"
        }

    elif action_type == ActionType.MESSAGE_CUSTOMER:
        return {
            "type": "action",
            "action": action_type.value,
            "payload": payload,
            "result": "simulated_success",
            "details": f"Customer message dispatched for run {run_id}: {payload.get('message', 'No details')}"
        }

    elif action_type == ActionType.CREATE_INTERNAL_NOTE:
        return {
            "type": "action",
            "action": action_type.value,
            "payload": payload,
            "result": "simulated_success",
            "details": f"Internal note recorded for run {run_id}: {payload.get('note', 'No note content')}"
        }

    else:
        return {
            "type": "action",
            "action": str(action_type),
            "payload": payload,
            "result": "unknown_action_type",
            "details": f"Unknown action type {action_type} simulated as no-op success."
        }

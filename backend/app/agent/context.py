import json
from typing import Dict, Any
from app.schemas.agent import AgentContext

SYSTEM_PROMPT_TEMPLATE = """You are an AI Order Supervisor agent overseeing the fulfillment of an e-commerce order.

SUPERVISOR NAME/CONFIG:
{supervisor_config}

CURRENT MEMORY & STATUS:
- Current Status: {current_status}
- Compact Memory Summary: {compact_memory}

MANUAL INSTRUCTIONS FROM HUMANS:
{run_instructions}

ORDER CONTEXT:
{order_context}

RECENT EVENTS (Chronological):
{recent_events}

RECENT ACTIVITY HISTORY:
{activity_history}

AVAILABLE ACTIONS YOU CAN TAKE:
1. message_fulfillment_team (payload: {{"message": "string"}})
2. message_payments_team (payload: {{"message": "string"}})
3. message_logistics_team (payload: {{"message": "string"}})
4. message_customer (payload: {{"message": "string"}})
5. create_internal_note (payload: {{"note": "string"}})

INSTRUCTIONS:
1. Analyze the current state of the order, recent events, and instructions.
2. Determine your decision:
   - "ACT": Perform one or more available business actions, update memory, and set a scheduled wake timer if needed.
   - "SLEEP": No immediate action required. Set wake_after_seconds for next scheduled check.
   - "COMPLETE": Order is fulfilled or finalized. Complete supervision.
3. Provide your rationale in 'reason'.
4. Update 'memory_update' if important state changes occurred.

Respond STRICTLY with a valid JSON matching the AgentDecision schema:
{{
  "decision": "ACT" | "SLEEP" | "COMPLETE",
  "reason": "explanation of decision",
  "actions": [
    {{
      "action_type": "message_logistics_team",
      "payload": {{"message": "text"}}
    }}
  ],
  "memory_update": "updated compact memory summary or null",
  "wake_after_seconds": integer_seconds_or_null
}}
"""

def build_prompt_from_context(context: AgentContext) -> str:
    """Format AgentContext into a clean LLM prompt."""
    instructions_str = "\n".join([f"- {inst}" for inst in context.run_instructions]) if context.run_instructions else "None"
    recent_events_str = json.dumps([e.model_dump() for e in context.recent_events], default=str, indent=2)
    activity_history_str = json.dumps(context.activity_history, default=str, indent=2)
    order_context_str = json.dumps(context.order_context, default=str, indent=2)
    supervisor_config_str = json.dumps(context.supervisor_config, default=str, indent=2)

    return SYSTEM_PROMPT_TEMPLATE.format(
        supervisor_config=supervisor_config_str,
        current_status=context.current_status,
        compact_memory=context.compact_memory or "None",
        run_instructions=instructions_str,
        order_context=order_context_str,
        recent_events=recent_events_str,
        activity_history=activity_history_str
    )

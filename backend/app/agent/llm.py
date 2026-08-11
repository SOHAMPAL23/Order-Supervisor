import json
import logging
import uuid
from typing import Protocol
from openai import AsyncOpenAI
from pydantic import ValidationError

from app.config import settings
from app.schemas.agent import AgentContext, AgentDecision, AgentAction, ActionType
from app.schemas.event import EventType
from app.agent.context import build_prompt_from_context

logger = logging.getLogger(__name__)

class LLMProvider(Protocol):
    async def decide(self, context: AgentContext) -> AgentDecision:
        ...

class OpenAILLMProvider:
    """OpenAI implementation of LLMProvider with structured response handling."""
    
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def decide(self, context: AgentContext) -> AgentDecision:
        if not self.client:
            raise ValueError("OpenAI API key is not configured. Falling back.")

        prompt = build_prompt_from_context(context)
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a precise, business-oriented AI order supervisor."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response received from LLM provider.")

        raw_json = json.loads(content)
        
        # Ensure action IDs exist for idempotency tracking
        if "actions" in raw_json and isinstance(raw_json["actions"], list):
            for act in raw_json["actions"]:
                if not act.get("action_id"):
                    act["action_id"] = f"act_{uuid.uuid4().hex[:8]}"

        return AgentDecision(**raw_json)

class FallbackLLMProvider:
    """Heuristic rule-based fallback LLM provider used when LLM API keys are absent or requests fail."""

    async def decide(self, context: AgentContext) -> AgentDecision:
        logger.info(f"Fallback LLM provider evaluating run {context.run_id}")
        
        recent_events = context.recent_events
        latest_event = recent_events[-1].event_type if recent_events else "none"
        
        actions = []
        memory_update = context.compact_memory
        
        if latest_event == EventType.PAYMENT_FAILED.value:
            actions.append(AgentAction(
                action_id=f"act_pfailed_{uuid.uuid4().hex[:8]}",
                action_type=ActionType.MESSAGE_CUSTOMER,
                payload={"message": f"Payment failed for Order {context.order_id}. Please update payment method."}
            ))
            actions.append(AgentAction(
                action_id=f"act_pfailed_note_{uuid.uuid4().hex[:8]}",
                action_type=ActionType.CREATE_INTERNAL_NOTE,
                payload={"note": "Payment failed event processed. Customer notified."}
            ))
            memory_update = f"Payment failure detected for order {context.order_id}. Customer notified."
            return AgentDecision(
                decision="ACT",
                reason="Payment failure event detected. Triggering customer notification and internal note.",
                actions=actions,
                memory_update=memory_update,
                wake_after_seconds=300
            )

        elif latest_event == EventType.SHIPMENT_DELAYED.value:
            actions.append(AgentAction(
                action_id=f"act_sdelayed_{uuid.uuid4().hex[:8]}",
                action_type=ActionType.MESSAGE_LOGISTICS_TEAM,
                payload={"message": f"Shipment delayed for Order {context.order_id}. Please investigate carrier status."}
            ))
            actions.append(AgentAction(
                action_id=f"act_sdelayed_cust_{uuid.uuid4().hex[:8]}",
                action_type=ActionType.MESSAGE_CUSTOMER,
                payload={"message": f"Your order {context.order_id} has experienced a minor shipping delay."}
            ))
            memory_update = f"Shipment delay flagged for order {context.order_id}. Logistics team and customer alerted."
            return AgentDecision(
                decision="ACT",
                reason="Shipment delay detected. Alerted logistics team and customer.",
                actions=actions,
                memory_update=memory_update,
                wake_after_seconds=600
            )

        elif latest_event == EventType.DELIVERED.value:
            memory_update = f"Order {context.order_id} successfully delivered."
            return AgentDecision(
                decision="COMPLETE",
                reason="Delivery confirmed. Completing supervision.",
                actions=[AgentAction(
                    action_id=f"act_delivered_{uuid.uuid4().hex[:8]}",
                    action_type=ActionType.CREATE_INTERNAL_NOTE,
                    payload={"note": "Order successfully delivered. Workflow complete."}
                )],
                memory_update=memory_update,
                wake_after_seconds=None
            )

        # Default standard check decision
        return AgentDecision(
            decision="SLEEP",
            reason=f"Order {context.order_id} progressing normally. Routine check scheduled.",
            actions=[],
            memory_update=f"Order status normal as of latest check.",
            wake_after_seconds=300
        )

def get_llm_provider() -> LLMProvider:
    """Factory to get configured LLM provider or fallback provider."""
    if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        try:
            return OpenAILLMProvider()
        except Exception as e:
            logger.warning(f"Could not instantiate OpenAILLMProvider: {e}. Using FallbackLLMProvider.")
            return FallbackLLMProvider()
    return FallbackLLMProvider()

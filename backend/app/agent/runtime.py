import logging
from app.schemas.agent import AgentContext, AgentDecision
from app.agent.llm import get_llm_provider, FallbackLLMProvider

logger = logging.getLogger(__name__)

class AgentRuntime:
    """Agent Runtime engine managing decision inference with safe exception catching and fallbacks."""

    def __init__(self, provider=None):
        self.provider = provider or get_llm_provider()
        self.fallback_provider = FallbackLLMProvider()

    async def evaluate(self, context: AgentContext) -> AgentDecision:
        logger.info(f"AgentRuntime evaluating run {context.run_id} for order {context.order_id}")
        
        try:
            decision = await self.provider.decide(context)
            logger.info(f"Agent decision for run {context.run_id}: {decision.decision} - {decision.reason}")
            return decision
        except Exception as e:
            logger.error(f"LLM Provider execution failed for run {context.run_id}: {e}. Triggering safe fallback.")
            
            # Safe Fallback Behavior: catch error, use safe fallback decision, keep workflow alive
            try:
                fallback_decision = await self.fallback_provider.decide(context)
                fallback_decision.reason = f"[SAFE FALLBACK triggered due to LLM error: {str(e)}] {fallback_decision.reason}"
                return fallback_decision
            except Exception as fallback_err:
                logger.critical(f"Fallback provider also failed for run {context.run_id}: {fallback_err}")
                return AgentDecision(
                    decision="SLEEP",
                    reason=f"Primary and fallback LLM evaluations failed. Error: {str(fallback_err)}. Keeping workflow alive.",
                    actions=[],
                    memory_update=None,
                    wake_after_seconds=300
                )

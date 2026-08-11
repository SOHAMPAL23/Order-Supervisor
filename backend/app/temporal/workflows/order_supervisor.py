from datetime import timedelta, datetime
from typing import Dict, Any, List, Optional
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.schemas.event import OrderEvent, AddInstructionPayload, EventType
    from app.schemas.agent import AgentDecision, AgentAction, AgentContext
    from app.agent.wake_policy import RuleBasedWakePolicy

# Activity execution configuration with sensible timeouts
default_activity_schedule_to_close_timeout = timedelta(seconds=60)
default_retry_policy = RetryPolicy(
    maximum_attempts=3,
    initial_interval=timedelta(seconds=1),
    maximum_interval=timedelta(seconds=10),
)

def _log_info(msg: str) -> None:
    try:
        workflow.logger.info(msg)
    except Exception:
        pass

@workflow.defn(name="OrderSupervisorWorkflow")
class OrderSupervisorWorkflow:
    def __init__(self) -> None:
        self.order_id: str = ""
        self.run_id: str = ""
        self.supervisor_config: Dict[str, Any] = {}
        self.order_context: Dict[str, Any] = {}
        self.state: str = "STARTING"
        
        self.compact_memory: str = "Initial order supervisor started."
        self.run_instructions: List[str] = []
        self.recent_events: List[Dict[str, Any]] = []
        self.activity_history: List[Dict[str, Any]] = []
        
        self.events_queue: List[Dict[str, Any]] = []
        self.processed_event_ids: List[str] = []
        self.processed_action_ids: List[str] = []
        
        self.next_wake_at: Optional[str] = None
        self.wake_policy = RuleBasedWakePolicy()
        self.is_terminal: bool = False
        self.termination_reason: Optional[str] = None
        self.timer_wake_requested: bool = False

    @workflow.run
    async def run(self, params: Dict[str, Any]) -> Dict[str, Any]:
        self.order_id = params["order_id"]
        self.run_id = params["run_id"]
        self.supervisor_config = params.get("supervisor_config", {})
        self.order_context = params.get("order_context", {})
        self.state = "STARTING"

        # Log workflow start activity
        await self._log_activity(
            type="workflow_started",
            payload={"order_id": self.order_id, "run_id": self.run_id}
        )

        # Update initial DB state to ACTIVE
        self.state = "ACTIVE"
        await self._update_run_status("ACTIVE")

        # Workflow Start Trigger (Requirement 4.A): Immediately analyze initial order
        await self._evaluate_and_run_agent(trigger_reason="workflow_start")

        # Main Durable Event Loop
        while not self.is_terminal:
            # Handle PAUSED or INTERRUPTED states
            if self.state in ["PAUSED", "INTERRUPTED"]:
                _log_info(f"Workflow {self.run_id} is in {self.state} state. Waiting for resume...")
                await workflow.wait_condition(
                    lambda: self.state not in ["PAUSED", "INTERRUPTED"] or self.is_terminal
                )
                if self.is_terminal:
                    break
                _log_info(f"Workflow {self.run_id} resumed execution.")

            # Process pending events queue
            if len(self.events_queue) > 0:
                event_dict = self.events_queue.pop(0)
                event_id = event_dict.get("event_id")

                # Idempotency check (Requirement 17)
                if event_id and event_id in self.processed_event_ids:
                    _log_info(f"Duplicate event {event_id} received. Skipping duplicate processing.")
                    await self._log_activity(
                        type="duplicate_event_skipped",
                        event_id=event_id,
                        payload={"event": event_dict}
                    )
                    continue

                if event_id:
                    self.processed_event_ids.append(event_id)

                self.recent_events.append(event_dict)
                event_type = event_dict.get("event_type", "unknown")

                # Evaluate Wake Policy (Requirement 7)
                wake_decision = self.wake_policy.should_wake(event_type, self.state)
                await self._log_activity(
                    type="wake_policy_decision",
                    event_id=event_id,
                    payload={"event_type": event_type, "wake_decision": wake_decision.model_dump()}
                )

                if wake_decision.priority == "TERMINAL" or event_type == EventType.DELIVERED.value:
                    # Finalization trigger (Requirement 19)
                    _log_info(f"Terminal event '{event_type}' received. Initiating workflow finalization.")
                    await self._evaluate_and_run_agent(trigger_reason=f"terminal_event:{event_type}")
                    await self._finalize_workflow()
                    break

                elif wake_decision.should_wake:
                    self.state = "ACTIVE"
                    await self._update_run_status("ACTIVE")
                    await self._evaluate_and_run_agent(trigger_reason=f"incoming_event:{event_type}")

                else:
                    _log_info(f"Event '{event_type}' recorded but wake policy decided not to wake agent immediately.")

            # Scheduled Sleep / Durable Timer Handling (Requirement 4.C)
            else:
                self.state = "SLEEPING"
                await self._update_run_status("SLEEPING", self.next_wake_at)

                # Durable timer or wait for incoming signal
                wait_seconds = 300  # Default background heartbeat
                if self.next_wake_at:
                    try:
                        wake_dt = datetime.fromisoformat(self.next_wake_at)
                        now_dt = workflow.now()
                        diff = (wake_dt - now_dt).total_seconds()
                        if diff > 0:
                            wait_seconds = min(diff, 86400)  # Cap at 24h intervals
                    except Exception:
                        wait_seconds = 300

                _log_info(f"Workflow sleeping for {wait_seconds}s or until signal received.")
                
                # Durable timer wait condition
                timer_expired = await workflow.wait_condition(
                    lambda: len(self.events_queue) > 0 or self.state not in ["SLEEPING"] or self.is_terminal,
                    timeout=wait_seconds
                )

                if not timer_expired:
                    # Timer expired organically
                    _log_info("Scheduled wake timer expired. Running agent supervision check.")
                    self.state = "ACTIVE"
                    self.next_wake_at = None
                    await self._update_run_status("ACTIVE")
                    await self._evaluate_and_run_agent(trigger_reason="scheduled_timer_wakeup")

        # Terminal state reached
        if self.state != "COMPLETED":
            self.state = "TERMINATED" if self.state != "COMPLETED" else "COMPLETED"
            await self._update_run_status(self.state)

        await self._log_activity(
            type="workflow_finished",
            payload={"status": self.state, "reason": self.termination_reason}
        )

        return {
            "run_id": self.run_id,
            "order_id": self.order_id,
            "status": self.state,
            "compact_memory": self.compact_memory,
            "termination_reason": self.termination_reason
        }

    async def _evaluate_and_run_agent(self, trigger_reason: str) -> None:
        """Construct context, invoke agent runtime activity, and execute actions."""
        context = {
            "order_id": self.order_id,
            "run_id": self.run_id,
            "order_context": self.order_context,
            "supervisor_config": self.supervisor_config,
            "run_instructions": self.run_instructions,
            "current_status": self.state,
            "recent_events": self.recent_events[-10:],
            "activity_history": self.activity_history[-10:],
            "compact_memory": self.compact_memory
        }

        await self._log_activity(type="agent_started", payload={"trigger_reason": trigger_reason})

        # Activity call to Agent Runtime (Requirement 10)
        decision_dict = await workflow.execute_activity(
            "run_agent_activity",
            context,
            schedule_to_close_timeout=default_activity_schedule_to_close_timeout,
            retry_policy=default_retry_policy
        )

        await self._log_activity(type="agent_decision", payload=decision_dict)

        decision_type = decision_dict.get("decision", "SLEEP")
        memory_update = decision_dict.get("memory_update")
        wake_after = decision_dict.get("wake_after_seconds")
        actions = decision_dict.get("actions", [])

        # Memory Update
        if memory_update:
            self.compact_memory = memory_update
            await workflow.execute_activity(
                "update_memory_activity",
                {"run_id": self.run_id, "memory_summary": self.compact_memory},
                schedule_to_close_timeout=default_activity_schedule_to_close_timeout,
                retry_policy=default_retry_policy
            )
            await self._log_activity(type="memory_updated", payload={"compact_memory": self.compact_memory})

        # Action Execution
        for action in actions:
            action_id = action.get("action_id")
            if action_id and action_id in self.processed_action_ids:
                _log_info(f"Duplicate action {action_id} skipped.")
                continue

            if action_id:
                self.processed_action_ids.append(action_id)

            await self._log_activity(type="action_started", payload={"action": action})
            
            result = await workflow.execute_activity(
                "execute_action_activity",
                {"run_id": self.run_id, "action": action},
                schedule_to_close_timeout=default_activity_schedule_to_close_timeout,
                retry_policy=default_retry_policy
            )

            await self._log_activity(type="action_completed", payload={"action": action, "result": result})
            self.activity_history.append({"action": action, "result": result, "timestamp": workflow.now().isoformat()})

        # Scheduled Sleep Calculation
        if wake_after and wake_after > 0:
            wake_dt = workflow.now() + timedelta(seconds=wake_after)
            self.next_wake_at = wake_dt.isoformat()
            await self._log_activity(type="sleep_scheduled", payload={"wake_after_seconds": wake_after, "next_wake_at": self.next_wake_at})

        if decision_type == "COMPLETE":
            self.is_terminal = True
            await self._finalize_workflow()

    async def _finalize_workflow(self) -> None:
        """Run workflow finalization activity to store summaries, learnings, and recommendations."""
        self.state = "COMPLETING"
        await self._update_run_status("COMPLETING")

        context = {
            "order_id": self.order_id,
            "run_id": self.run_id,
            "order_context": self.order_context,
            "supervisor_config": self.supervisor_config,
            "run_instructions": self.run_instructions,
            "current_status": "COMPLETING",
            "recent_events": self.recent_events[-10:],
            "activity_history": self.activity_history[-10:],
            "compact_memory": self.compact_memory
        }

        final_res = await workflow.execute_activity(
            "generate_final_summary_activity",
            context,
            schedule_to_close_timeout=default_activity_schedule_to_close_timeout,
            retry_policy=default_retry_policy
        )

        self.state = "COMPLETED"
        self.is_terminal = True
        await self._log_activity(type="workflow_completed", payload=final_res)

    async def _update_run_status(self, status: str, next_wake_at: Optional[str] = None) -> None:
        try:
            await workflow.execute_activity(
                "update_run_status_activity",
                {"run_id": self.run_id, "status": status, "next_wake_at": next_wake_at},
                schedule_to_close_timeout=default_activity_schedule_to_close_timeout,
                retry_policy=default_retry_policy
            )
        except Exception:
            pass

    async def _log_activity(self, type: str, payload: Dict[str, Any], event_id: Optional[str] = None, action: Optional[str] = None) -> None:
        activity_data = {
            "run_id": self.run_id,
            "event_id": event_id,
            "type": type,
            "action": action,
            "payload": payload
        }
        try:
            await workflow.execute_activity(
                "persist_activity_log",
                activity_data,
                schedule_to_close_timeout=default_activity_schedule_to_close_timeout,
                retry_policy=default_retry_policy
            )
        except Exception:
            pass

    # -------------------------------------------------------------------------
    # WORKFLOW SIGNALS (Requirement 5)
    # -------------------------------------------------------------------------
    @workflow.signal
    async def order_event(self, event_dict: Dict[str, Any]) -> None:
        """Receive incoming order event signal."""
        _log_info(f"Signal received: order_event {event_dict.get('event_type')}")
        self.events_queue.append(event_dict)
        await self._log_activity(
            type="signal_received",
            event_id=event_dict.get("event_id"),
            payload={"signal": "order_event", "event": event_dict}
        )

    @workflow.signal
    async def add_instruction(self, payload_dict: Dict[str, Any]) -> None:
        """Receive human instruction signal."""
        instruction = payload_dict.get("instruction", "")
        if instruction:
            self.run_instructions.append(instruction)
            await self._log_activity(
                type="signal_received",
                payload={"signal": "add_instruction", "instruction": instruction}
            )
            # Wake up agent immediately to process manual instruction
            if self.state in ["SLEEPING", "ACTIVE"]:
                self.state = "ACTIVE"
                await self._evaluate_and_run_agent(trigger_reason="manual_instruction_added")

    @workflow.signal
    async def pause(self) -> None:
        """Pause workflow execution."""
        if not self.is_terminal:
            self.state = "PAUSED"
            await self._update_run_status("PAUSED")
            await self._log_activity(type="signal_received", payload={"signal": "pause"})

    @workflow.signal
    async def resume(self) -> None:
        """Resume workflow execution."""
        if self.state in ["PAUSED", "INTERRUPTED"]:
            self.state = "ACTIVE"
            await self._update_run_status("ACTIVE")
            await self._log_activity(type="signal_received", payload={"signal": "resume"})
            # Evaluate agent on resume in case pending work accumulated
            await self._evaluate_and_run_agent(trigger_reason="workflow_resumed")

    @workflow.signal
    async def interrupt(self, reason: str = "Manual interrupt") -> None:
        """Interrupt workflow execution."""
        if not self.is_terminal:
            self.state = "INTERRUPTED"
            await self._update_run_status("INTERRUPTED")
            await self._log_activity(type="signal_received", payload={"signal": "interrupt", "reason": reason})

    @workflow.signal
    async def terminate(self, reason: str = "Manual termination") -> None:
        """Terminate workflow execution."""
        self.is_terminal = True
        self.termination_reason = reason
        self.state = "TERMINATED"
        await self._update_run_status("TERMINATED")
        await self._log_activity(type="signal_received", payload={"signal": "terminate", "reason": reason})

    # -------------------------------------------------------------------------
    # WORKFLOW QUERIES
    # -------------------------------------------------------------------------
    @workflow.query
    def get_state(self) -> str:
        return self.state

    @workflow.query
    def get_memory(self) -> str:
        return self.compact_memory

    @workflow.query
    def get_timeline(self) -> List[Dict[str, Any]]:
        return self.recent_events

    @workflow.query
    def get_status(self) -> Dict[str, Any]:
        return {
            "order_id": self.order_id,
            "run_id": self.run_id,
            "state": self.state,
            "compact_memory": self.compact_memory,
            "next_wake_at": self.next_wake_at,
            "pending_events_count": len(self.events_queue),
            "instructions_count": len(self.run_instructions)
        }

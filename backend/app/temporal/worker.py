import asyncio
import logging
from temporalio.client import Client
from temporalio.worker import Worker

from app.config import settings
from app.temporal.workflows.order_supervisor import OrderSupervisorWorkflow
from app.temporal.activities.activities import (
    run_agent_activity,
    execute_action_activity,
    persist_activity_log,
    update_memory_activity,
    update_run_status_activity,
    generate_final_summary_activity,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_worker():
    logger.info(f"Connecting Temporal worker to host {settings.TEMPORAL_HOST}...")
    client = await Client.connect(
        settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE
    )

    worker = Worker(
        client,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        workflows=[OrderSupervisorWorkflow],
        activities=[
            run_agent_activity,
            execute_action_activity,
            persist_activity_log,
            update_memory_activity,
            update_run_status_activity,
            generate_final_summary_activity,
        ],
    )

    logger.info(f"Temporal Worker listening on task queue: '{settings.TEMPORAL_TASK_QUEUE}'")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(run_worker())

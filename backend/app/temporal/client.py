from typing import Optional
from temporalio.client import Client
from app.config import settings

_temporal_client: Optional[Client] = None

async def get_temporal_client() -> Client:
    global _temporal_client
    if _temporal_client is None:
        _temporal_client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE,
        )
    return _temporal_client

async def close_temporal_client() -> None:
    global _temporal_client
    if _temporal_client is not None:
        # temporalio client connection does not require explicit async close
        _temporal_client = None

from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.run import Run
from app.schemas.run import RunCreate

class RunRepository:

    async def create(self, db: AsyncSession, obj_in: RunCreate) -> Run:
        db_obj = Run(
            order_id=obj_in.order_id,
            supervisor_id=obj_in.supervisor_id,
            order_context=obj_in.order_context,
            status="STARTING",
            memory_summary="Run initialized."
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_id(self, db: AsyncSession, id: str) -> Optional[Run]:
        result = await db.execute(select(Run).filter(Run.id == id))
        return result.scalars().first()

    async def get_by_order_id(self, db: AsyncSession, order_id: str) -> Optional[Run]:
        result = await db.execute(select(Run).filter(Run.order_id == order_id).order_by(Run.created_at.desc()))
        return result.scalars().first()

    async def list_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Run]:
        result = await db.execute(select(Run).order_by(Run.created_at.desc()).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def update_status(self, db: AsyncSession, id: str, status: str, next_wake_at: Optional[datetime] = None) -> Optional[Run]:
        run = await self.get_by_id(db, id)
        if run:
            run.status = status
            run.next_wake_at = next_wake_at
            run.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(run)
        return run

run_repo = RunRepository()

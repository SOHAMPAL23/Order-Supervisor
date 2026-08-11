from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate

class ActivityRepository:

    async def create(self, db: AsyncSession, obj_in: ActivityCreate) -> Activity:
        db_obj = Activity(
            run_id=obj_in.run_id,
            event_id=obj_in.event_id,
            type=obj_in.type,
            action=obj_in.action,
            payload=obj_in.payload
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def list_by_run(self, db: AsyncSession, run_id: str, skip: int = 0, limit: int = 500) -> List[Activity]:
        result = await db.execute(
            select(Activity)
            .filter(Activity.run_id == run_id)
            .order_by(Activity.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

activity_repo = ActivityRepository()

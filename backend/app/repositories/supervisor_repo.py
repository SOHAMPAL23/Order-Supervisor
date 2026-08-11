from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.supervisor import Supervisor
from app.schemas.supervisor import SupervisorCreate, SupervisorUpdate

class SupervisorRepository:

    async def create(self, db: AsyncSession, obj_in: SupervisorCreate) -> Supervisor:
        db_obj = Supervisor(
            name=obj_in.name,
            base_instruction=obj_in.base_instruction,
            available_actions=obj_in.available_actions,
            wake_policy=obj_in.wake_policy,
            model_config_settings=obj_in.model_config_settings,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_id(self, db: AsyncSession, id: str) -> Optional[Supervisor]:
        result = await db.execute(select(Supervisor).filter(Supervisor.id == id))
        return result.scalars().first()

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Supervisor]:
        result = await db.execute(select(Supervisor).filter(Supervisor.name == name))
        return result.scalars().first()

    async def list_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Supervisor]:
        result = await db.execute(select(Supervisor).offset(skip).limit(limit))
        return list(result.scalars().all())

supervisor_repo = SupervisorRepository()

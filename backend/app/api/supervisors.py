from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.response import APIResponse
from app.schemas.supervisor import SupervisorCreate, SupervisorResponse
from app.repositories.supervisor_repo import supervisor_repo

router = APIRouter(prefix="/supervisors", tags=["Supervisors"])

@router.post("", response_model=APIResponse[SupervisorResponse], status_code=status.HTTP_201_CREATED)
async def create_supervisor(
    payload: SupervisorCreate,
    db: AsyncSession = Depends(get_db)
):
    existing = await supervisor_repo.get_by_name(db, payload.name)
    if existing:
        return APIResponse.fail(
            code="SUPERVISOR_EXISTS",
            message=f"Supervisor with name '{payload.name}' already exists."
        )
    
    supervisor = await supervisor_repo.create(db, payload)
    return APIResponse.ok(SupervisorResponse.model_validate(supervisor))

@router.get("", response_model=APIResponse[List[SupervisorResponse]])
async def list_supervisors(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    supervisors = await supervisor_repo.list_all(db, skip=skip, limit=limit)
    res = [SupervisorResponse.model_validate(s) for s in supervisors]
    return APIResponse.ok(res)

@router.get("/{id}", response_model=APIResponse[SupervisorResponse])
async def get_supervisor(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    supervisor = await supervisor_repo.get_by_id(db, id)
    if not supervisor:
        return APIResponse.fail(
            code="SUPERVISOR_NOT_FOUND",
            message=f"Supervisor with ID '{id}' was not found."
        )
    return APIResponse.ok(SupervisorResponse.model_validate(supervisor))

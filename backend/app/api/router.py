from fastapi import APIRouter
from app.api.supervisors import router as supervisors_router
from app.api.runs import router as runs_router
from app.api.events import router as events_router

api_router = APIRouter()
api_router.include_router(supervisors_router)
api_router.include_router(runs_router)
api_router.include_router(events_router)

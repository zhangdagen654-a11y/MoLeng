from fastapi import APIRouter
from app.tasks.task_manager import task_manager

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/{task_id}")
async def get_task_status(task_id: str):
    status = task_manager.get_status(task_id)
    if not status:
        return {"error": "任务不存在"}
    return status

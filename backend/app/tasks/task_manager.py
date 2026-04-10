import asyncio
import uuid
from datetime import datetime
from typing import Any, Coroutine


class TaskInfo:
    def __init__(self, task_id: str, task_type: str):
        self.task_id = task_id
        self.type = task_type
        self.status = "pending"
        self.result: Any = None
        self.error: str | None = None
        self.created_at = datetime.now()

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "type": self.type,
            "status": self.status,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
        }


class TaskManager:
    def __init__(self):
        self._tasks: dict[str, TaskInfo] = {}
        self._async_tasks: dict[str, asyncio.Task] = {}

    def submit(self, task_type: str, coro: Coroutine) -> str:
        task_id = uuid.uuid4().hex[:12]
        info = TaskInfo(task_id, task_type)
        self._tasks[task_id] = info

        async def _run():
            info.status = "running"
            try:
                info.result = await coro
                info.status = "completed"
            except Exception as e:
                info.error = str(e)
                info.status = "failed"

        self._async_tasks[task_id] = asyncio.create_task(_run())
        return task_id

    def get_status(self, task_id: str) -> dict | None:
        info = self._tasks.get(task_id)
        return info.to_dict() if info else None


task_manager = TaskManager()

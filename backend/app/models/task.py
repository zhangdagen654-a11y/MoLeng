from pydantic import BaseModel
from datetime import datetime
from typing import Any


class TaskStatus(BaseModel):
    task_id: str
    type: str
    status: str  # pending / running / completed / failed
    result: Any = None
    error: str | None = None
    created_at: datetime

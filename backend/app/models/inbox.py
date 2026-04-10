from pydantic import BaseModel
from datetime import datetime


class InboxCreate(BaseModel):
    content: str


class InboxItem(BaseModel):
    id: int
    content: str
    created_at: datetime
    status: str
    processed_date: str | None = None

from pydantic import BaseModel
from datetime import datetime


class DiaryCreate(BaseModel):
    date: str
    content: str
    source: str = "manual"


class DiaryUpdate(BaseModel):
    content: str


class DiaryMergeRequest(BaseModel):
    date: str | None = None
    extra_content: str | None = None


class DiaryItem(BaseModel):
    id: int
    date: str
    content: str
    source: str | None
    confirmed: bool
    created_at: datetime
    updated_at: datetime

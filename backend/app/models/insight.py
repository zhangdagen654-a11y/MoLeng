from pydantic import BaseModel
from datetime import datetime


class InsightCreate(BaseModel):
    review_id: int
    knowledge: str
    action: str | None = None


class InsightUpdate(BaseModel):
    knowledge: str | None = None
    action: str | None = None


class InsightItem(BaseModel):
    id: int
    review_id: int
    knowledge: str | None
    action: str | None
    related_insight_id: int | None
    confirmed: bool
    created_at: datetime
    updated_at: datetime

from pydantic import BaseModel, field_validator
from datetime import datetime

ALLOWED_TAGS = {"成功", "失败", "认知迭代"}


def validate_tags(tags: str) -> str:
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    for t in tag_list:
        if t not in ALLOWED_TAGS:
            raise ValueError(f"标签 '{t}' 不合法，只能使用：成功、失败、认知迭代")
    return ",".join(tag_list)


class ReviewCreate(BaseModel):
    diary_id: int
    event: str
    decision: str
    deviation: str
    attribution: str
    tags: str

    @field_validator("tags")
    @classmethod
    def check_tags(cls, v: str) -> str:
        return validate_tags(v)


class ReviewUpdate(BaseModel):
    event: str | None = None
    decision: str | None = None
    deviation: str | None = None
    attribution: str | None = None
    tags: str | None = None

    @field_validator("tags")
    @classmethod
    def check_tags(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return validate_tags(v)


class ReviewItem(BaseModel):
    id: int
    diary_id: int
    event: str | None
    decision: str | None
    deviation: str | None
    attribution: str | None
    tags: str | None
    confirmed: bool
    created_at: datetime
    updated_at: datetime

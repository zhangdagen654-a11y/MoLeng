import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.database import get_db
from app.repositories.review_repo import ReviewRepo
from app.repositories.insight_repo import InsightRepo
from app.models.review import ReviewCreate, ReviewUpdate, ReviewItem
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("", response_model=ReviewItem)
async def create_review(body: ReviewCreate):
    """用户手动创建复盘"""
    db = await get_db()
    try:
        repo = ReviewRepo(db)
        review = await repo.create(
            diary_id=body.diary_id,
            event=body.event,
            decision=body.decision,
            deviation=body.deviation,
            attribution=body.attribution,
            tags=body.tags,
        )
        return review
    finally:
        await db.close()


@router.get("", response_model=list[ReviewItem])
async def get_reviews(tag: str | None = None):
    db = await get_db()
    try:
        repo = ReviewRepo(db)
        return await repo.get_list(tag)
    finally:
        await db.close()


@router.get("/{review_id}", response_model=ReviewItem)
async def get_review(review_id: int):
    db = await get_db()
    try:
        repo = ReviewRepo(db)
        review = await repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="复盘不存在")
        return review
    finally:
        await db.close()


@router.put("/{review_id}", response_model=ReviewItem)
async def update_review(review_id: int, body: ReviewUpdate):
    db = await get_db()
    try:
        repo = ReviewRepo(db)
        review = await repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="复盘不存在")
        if review["confirmed"]:
            raise HTTPException(status_code=400, detail="复盘已确认，不可修改")
        fields = body.model_dump(exclude_none=True)
        result = await repo.update(review_id, **fields)
        return result
    finally:
        await db.close()


@router.delete("/{review_id}")
async def delete_review(review_id: int):
    db = await get_db()
    try:
        repo = ReviewRepo(db)
        deleted = await repo.delete(review_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="复盘不存在或已确认")
        return {"ok": True}
    finally:
        await db.close()


@router.post("/{review_id}/confirm")
async def confirm_review(review_id: int):
    """确认复盘（仅锁定，不触发 AI）"""
    db = await get_db()
    try:
        review_repo = ReviewRepo(db)
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="复盘不存在")
        if review["confirmed"]:
            raise HTTPException(status_code=400, detail="复盘已确认")
        await review_repo.confirm(review_id)
        return {"ok": True, "review_id": review_id}
    finally:
        await db.close()


@router.post("/{review_id}/suggest-insight")
async def suggest_insight(review_id: int):
    """流式返回 AI 心得建议（不保存到数据库）"""
    db = await get_db()
    try:
        review_repo = ReviewRepo(db)
        insight_repo = InsightRepo(db)
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="复盘不存在")
        if not review["confirmed"]:
            raise HTTPException(status_code=400, detail="请先确认复盘")
        history = await insight_repo.get_all_confirmed()
    finally:
        await db.close()

    async def generate():
        full_text = ""
        try:
            async for token in ai_service.suggest_insight_stream(review, history):
                full_text += token
                yield sse_event("token", {"text": token})
            result = ai_service._parse_json(full_text)
            yield sse_event("done", {"suggestion": result})
        except Exception as e:
            yield sse_event("error", {"message": str(e)})

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

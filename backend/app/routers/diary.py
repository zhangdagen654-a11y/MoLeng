import json
from datetime import date
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.database import get_db
from app.repositories.diary_repo import DiaryRepo
from app.repositories.inbox_repo import InboxRepo
from app.models.diary import DiaryCreate, DiaryUpdate, DiaryMergeRequest, DiaryItem
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/diary", tags=["diary"])


def sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/merge")
async def merge_diary(req: DiaryMergeRequest):
    target_date = req.date or date.today().isoformat()

    db = await get_db()
    try:
        inbox_repo = InboxRepo(db)
        fragments = await inbox_repo.get_pending(target_date)
        if not fragments and not req.extra_content:
            raise HTTPException(status_code=400, detail="没有待处理的碎片，也没有补充内容")
        fragment_texts = [f["content"] for f in fragments]
        fragment_ids = [f["id"] for f in fragments]
    finally:
        await db.close()

    async def generate():
        full_text = ""
        try:
            async for token in ai_service.merge_fragments_stream(fragment_texts, req.extra_content):
                full_text += token
                yield sse_event("token", {"text": token})

            # 流完成，保存到数据库
            db2 = await get_db()
            try:
                diary_repo = DiaryRepo(db2)
                inbox_repo2 = InboxRepo(db2)
                source = "mixed" if req.extra_content and fragment_ids else ("merged" if fragment_ids else "manual")
                diary = await diary_repo.upsert(target_date, full_text, source)
                if fragment_ids:
                    await inbox_repo2.mark_processed(fragment_ids, target_date)
                yield sse_event("done", {"result": diary})
            finally:
                await db2.close()
        except Exception as e:
            yield sse_event("error", {"message": str(e)})

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("", response_model=list[DiaryItem])
async def get_diary_list(start_date: str | None = None, end_date: str | None = None):
    db = await get_db()
    try:
        repo = DiaryRepo(db)
        return await repo.get_list(start_date, end_date)
    finally:
        await db.close()


@router.get("/{date}", response_model=DiaryItem)
async def get_diary(date: str):
    db = await get_db()
    try:
        repo = DiaryRepo(db)
        diary = await repo.get_by_date(date)
        if not diary:
            raise HTTPException(status_code=404, detail="该日期没有日记")
        return diary
    finally:
        await db.close()


@router.put("/{date}", response_model=DiaryItem)
async def update_diary(date: str, body: DiaryUpdate):
    db = await get_db()
    try:
        repo = DiaryRepo(db)
        diary = await repo.get_by_date(date)
        if not diary:
            raise HTTPException(status_code=404, detail="该日期没有日记")
        if diary["confirmed"]:
            raise HTTPException(status_code=400, detail="日记已确认，不可修改")
        result = await repo.update(date, body.content)
        return result
    finally:
        await db.close()


@router.post("/{date}/confirm")
async def confirm_diary(date: str):
    """确认日记（仅锁定，不触发 AI）"""
    db = await get_db()
    try:
        diary_repo = DiaryRepo(db)
        diary = await diary_repo.get_by_date(date)
        if not diary:
            raise HTTPException(status_code=404, detail="该日期没有日记")
        if diary["confirmed"]:
            raise HTTPException(status_code=400, detail="日记已确认")
        await diary_repo.confirm(date)
        return {"ok": True, "date": date}
    finally:
        await db.close()


@router.post("/{date}/analyze")
async def analyze_diary(date: str):
    """流式返回 AI 分析建议（不保存到数据库）"""
    db = await get_db()
    try:
        diary_repo = DiaryRepo(db)
        diary = await diary_repo.get_by_date(date)
        if not diary:
            raise HTTPException(status_code=404, detail="该日期没有日记")
        if not diary["confirmed"]:
            raise HTTPException(status_code=400, detail="请先确认日记")
        diary_content = diary["content"]
    finally:
        await db.close()

    async def generate():
        full_text = ""
        try:
            async for token in ai_service.analyze_diary_stream(diary_content):
                full_text += token
                yield sse_event("token", {"text": token})
            result = ai_service._parse_json(full_text)
            yield sse_event("done", {"analysis": result})
        except Exception as e:
            yield sse_event("error", {"message": str(e)})

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("", response_model=DiaryItem)
async def create_diary(body: DiaryCreate):
    db = await get_db()
    try:
        repo = DiaryRepo(db)
        existing = await repo.get_by_date(body.date)
        if existing:
            raise HTTPException(status_code=400, detail="该日期已有日记")
        return await repo.create(body.date, body.content, body.source)
    finally:
        await db.close()

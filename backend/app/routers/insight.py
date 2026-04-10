from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.repositories.insight_repo import InsightRepo
from app.models.insight import InsightCreate, InsightUpdate, InsightItem

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.post("", response_model=InsightItem)
async def create_insight(body: InsightCreate):
    """用户手动创建心得"""
    db = await get_db()
    try:
        repo = InsightRepo(db)
        insight = await repo.create(
            review_id=body.review_id,
            knowledge=body.knowledge,
            action=body.action,
        )
        return insight
    finally:
        await db.close()


@router.get("", response_model=list[InsightItem])
async def get_insights(type: str | None = None):
    db = await get_db()
    try:
        repo = InsightRepo(db)
        return await repo.get_list(type)
    finally:
        await db.close()


@router.get("/{insight_id}", response_model=InsightItem)
async def get_insight(insight_id: int):
    db = await get_db()
    try:
        repo = InsightRepo(db)
        insight = await repo.get_by_id(insight_id)
        if not insight:
            raise HTTPException(status_code=404, detail="心得不存在")
        return insight
    finally:
        await db.close()


@router.get("/{insight_id}/chain")
async def get_insight_chain(insight_id: int):
    db = await get_db()
    try:
        repo = InsightRepo(db)
        chain = await repo.get_chain(insight_id)
        if not chain:
            raise HTTPException(status_code=404, detail="心得不存在")
        return chain
    finally:
        await db.close()


@router.put("/{insight_id}", response_model=InsightItem)
async def update_insight(insight_id: int, body: InsightUpdate):
    db = await get_db()
    try:
        repo = InsightRepo(db)
        insight = await repo.get_by_id(insight_id)
        if not insight:
            raise HTTPException(status_code=404, detail="心得不存在")
        if insight["confirmed"]:
            raise HTTPException(status_code=400, detail="心得已确认，不可修改")
        fields = body.model_dump(exclude_none=True)
        result = await repo.update(insight_id, **fields)
        return result
    finally:
        await db.close()


@router.post("/{insight_id}/confirm", response_model=InsightItem)
async def confirm_insight(insight_id: int):
    db = await get_db()
    try:
        repo = InsightRepo(db)
        insight = await repo.get_by_id(insight_id)
        if not insight:
            raise HTTPException(status_code=404, detail="心得不存在")
        result = await repo.confirm(insight_id)
        return result
    finally:
        await db.close()

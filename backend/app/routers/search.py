from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.repositories.search_repo import SearchRepo

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(q: str = "", type: str | None = None, limit: int = 20, offset: int = 0):
    if not q.strip():
        return []
    if type and type not in ("diary", "review", "insight"):
        raise HTTPException(status_code=400, detail="type 只支持 diary/review/insight")

    db = await get_db()
    try:
        repo = SearchRepo(db)
        results = await repo.search(q.strip(), type, limit, offset)
        return results
    except Exception:
        # FTS MATCH 语法错误时返回空
        return []
    finally:
        await db.close()


@router.post("/reindex")
async def reindex():
    """手动触发重建索引"""
    db = await get_db()
    try:
        repo = SearchRepo(db)
        await repo.rebuild_index()
        return {"ok": True}
    finally:
        await db.close()

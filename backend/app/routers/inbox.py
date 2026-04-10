from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.repositories.inbox_repo import InboxRepo
from app.models.inbox import InboxCreate, InboxItem

router = APIRouter(prefix="/api/inbox", tags=["inbox"])


@router.post("", response_model=InboxItem)
async def create_inbox(item: InboxCreate):
    db = await get_db()
    try:
        repo = InboxRepo(db)
        result = await repo.create(item.content)
        return result
    finally:
        await db.close()


@router.get("", response_model=list[InboxItem])
async def get_pending_inbox(date: str | None = None):
    db = await get_db()
    try:
        repo = InboxRepo(db)
        return await repo.get_pending(date)
    finally:
        await db.close()


@router.delete("/{inbox_id}")
async def delete_inbox(inbox_id: int):
    db = await get_db()
    try:
        repo = InboxRepo(db)
        deleted = await repo.delete(inbox_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="碎片不存在")
        return {"ok": True}
    finally:
        await db.close()

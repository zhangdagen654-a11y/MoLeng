from datetime import date
import aiosqlite


class InboxRepo:
    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def create(self, content: str) -> dict:
        cursor = await self.db.execute(
            "INSERT INTO inbox (content) VALUES (?)", (content,)
        )
        await self.db.commit()
        row = await (
            await self.db.execute("SELECT * FROM inbox WHERE id = ?", (cursor.lastrowid,))
        ).fetchone()
        return dict(row)

    async def get_pending(self, target_date: str | None = None) -> list[dict]:
        if target_date:
            rows = await (
                await self.db.execute(
                    "SELECT * FROM inbox WHERE status = 'pending' AND date(created_at) = ? ORDER BY created_at",
                    (target_date,),
                )
            ).fetchall()
        else:
            rows = await (
                await self.db.execute(
                    "SELECT * FROM inbox WHERE status = 'pending' ORDER BY created_at"
                )
            ).fetchall()
        return [dict(r) for r in rows]

    async def delete(self, inbox_id: int) -> bool:
        cursor = await self.db.execute("DELETE FROM inbox WHERE id = ?", (inbox_id,))
        await self.db.commit()
        return cursor.rowcount > 0

    async def mark_processed(self, ids: list[int], processed_date: str):
        placeholders = ",".join("?" * len(ids))
        await self.db.execute(
            f"UPDATE inbox SET status = 'processed', processed_date = ? WHERE id IN ({placeholders})",
            [processed_date] + ids,
        )
        await self.db.commit()

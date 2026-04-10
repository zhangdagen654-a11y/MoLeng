import aiosqlite


class ReviewRepo:
    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def create(self, diary_id: int, event: str, decision: str, deviation: str, attribution: str, tags: str) -> dict:
        cursor = await self.db.execute(
            "INSERT INTO review (diary_id, event, decision, deviation, attribution, tags) VALUES (?, ?, ?, ?, ?, ?)",
            (diary_id, event, decision, deviation, attribution, tags),
        )
        await self.db.commit()
        row = await (await self.db.execute("SELECT * FROM review WHERE id = ?", (cursor.lastrowid,))).fetchone()
        return dict(row)

    async def get_by_id(self, review_id: int) -> dict | None:
        row = await (await self.db.execute("SELECT * FROM review WHERE id = ?", (review_id,))).fetchone()
        return dict(row) if row else None

    async def get_by_diary_id(self, diary_id: int) -> list[dict]:
        rows = await (await self.db.execute("SELECT * FROM review WHERE diary_id = ? ORDER BY id", (diary_id,))).fetchall()
        return [dict(r) for r in rows]

    async def get_list(self, tag: str | None = None) -> list[dict]:
        if tag:
            rows = await (await self.db.execute(
                "SELECT * FROM review WHERE tags LIKE ? ORDER BY created_at DESC", (f"%{tag}%",)
            )).fetchall()
        else:
            rows = await (await self.db.execute("SELECT * FROM review ORDER BY created_at DESC")).fetchall()
        return [dict(r) for r in rows]

    async def update(self, review_id: int, **fields) -> dict | None:
        sets = []
        params = []
        for k, v in fields.items():
            if v is not None:
                sets.append(f"{k} = ?")
                params.append(v)
        if not sets:
            return await self.get_by_id(review_id)
        sets.append("updated_at = CURRENT_TIMESTAMP")
        params.append(review_id)
        await self.db.execute(f"UPDATE review SET {', '.join(sets)} WHERE id = ?", params)
        await self.db.commit()
        return await self.get_by_id(review_id)

    async def confirm(self, review_id: int) -> dict | None:
        await self.db.execute(
            "UPDATE review SET confirmed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (review_id,)
        )
        await self.db.commit()
        return await self.get_by_id(review_id)

    async def delete(self, review_id: int) -> bool:
        cursor = await self.db.execute("DELETE FROM review WHERE id = ? AND confirmed = 0", (review_id,))
        await self.db.commit()
        return cursor.rowcount > 0

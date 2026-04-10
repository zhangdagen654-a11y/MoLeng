import aiosqlite


class DiaryRepo:
    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def create(self, date: str, content: str, source: str = "manual") -> dict:
        await self.db.execute(
            "INSERT INTO diary (date, content, source) VALUES (?, ?, ?)",
            (date, content, source),
        )
        await self.db.commit()
        row = await (
            await self.db.execute("SELECT * FROM diary WHERE date = ?", (date,))
        ).fetchone()
        return dict(row)

    async def get_by_date(self, date: str) -> dict | None:
        row = await (
            await self.db.execute("SELECT * FROM diary WHERE date = ?", (date,))
        ).fetchone()
        return dict(row) if row else None

    async def get_list(self, start_date: str | None = None, end_date: str | None = None) -> list[dict]:
        query = "SELECT * FROM diary WHERE 1=1"
        params = []
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        query += " ORDER BY date DESC"
        rows = await (await self.db.execute(query, params)).fetchall()
        return [dict(r) for r in rows]

    async def update(self, date: str, content: str) -> dict | None:
        await self.db.execute(
            "UPDATE diary SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ? AND confirmed = 0",
            (content, date),
        )
        await self.db.commit()
        return await self.get_by_date(date)

    async def confirm(self, date: str) -> dict | None:
        await self.db.execute(
            "UPDATE diary SET confirmed = 1, updated_at = CURRENT_TIMESTAMP WHERE date = ?",
            (date,),
        )
        await self.db.commit()
        return await self.get_by_date(date)

    async def upsert(self, date: str, content: str, source: str) -> dict:
        existing = await self.get_by_date(date)
        if existing:
            await self.db.execute(
                "UPDATE diary SET content = ?, source = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?",
                (content, source, date),
            )
            await self.db.commit()
            return await self.get_by_date(date)
        return await self.create(date, content, source)

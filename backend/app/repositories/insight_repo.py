import aiosqlite


class InsightRepo:
    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def create(self, review_id: int, knowledge: str, action: str | None, related_insight_id: int | None = None) -> dict:
        cursor = await self.db.execute(
            "INSERT INTO insight (review_id, knowledge, action, related_insight_id) VALUES (?, ?, ?, ?)",
            (review_id, knowledge, action, related_insight_id),
        )
        await self.db.commit()
        row = await (await self.db.execute("SELECT * FROM insight WHERE id = ?", (cursor.lastrowid,))).fetchone()
        return dict(row)

    async def get_by_id(self, insight_id: int) -> dict | None:
        row = await (await self.db.execute("SELECT * FROM insight WHERE id = ?", (insight_id,))).fetchone()
        return dict(row) if row else None

    async def get_by_review_id(self, review_id: int) -> list[dict]:
        rows = await (await self.db.execute("SELECT * FROM insight WHERE review_id = ? ORDER BY id", (review_id,))).fetchall()
        return [dict(r) for r in rows]

    async def get_list(self, type_filter: str | None = None) -> list[dict]:
        if type_filter == "knowledge":
            rows = await (await self.db.execute(
                "SELECT * FROM insight WHERE knowledge IS NOT NULL AND knowledge != '' ORDER BY created_at DESC"
            )).fetchall()
        elif type_filter == "action":
            rows = await (await self.db.execute(
                "SELECT * FROM insight WHERE action IS NOT NULL AND action != '' ORDER BY created_at DESC"
            )).fetchall()
        else:
            rows = await (await self.db.execute("SELECT * FROM insight ORDER BY created_at DESC")).fetchall()
        return [dict(r) for r in rows]

    async def get_chain(self, insight_id: int) -> list[dict]:
        """获取心得迭代链：从最早到最新"""
        chain = []
        current = await self.get_by_id(insight_id)
        if not current:
            return chain
        # 先向上追溯到最早的心得
        visited = {current["id"]}
        while current and current.get("related_insight_id"):
            parent = await self.get_by_id(current["related_insight_id"])
            if not parent or parent["id"] in visited:
                break
            visited.add(parent["id"])
            current = parent
        # 从最早的开始，向下收集
        chain.append(current)
        # 查找所有指向当前心得的后续心得
        while True:
            row = await (await self.db.execute(
                "SELECT * FROM insight WHERE related_insight_id = ?", (current["id"],)
            )).fetchone()
            if not row:
                break
            current = dict(row)
            chain.append(current)
        return chain

    async def get_all_confirmed(self) -> list[dict]:
        rows = await (await self.db.execute(
            "SELECT * FROM insight WHERE confirmed = 1 ORDER BY created_at DESC"
        )).fetchall()
        return [dict(r) for r in rows]

    async def update(self, insight_id: int, **fields) -> dict | None:
        sets = []
        params = []
        for k, v in fields.items():
            if v is not None:
                sets.append(f"{k} = ?")
                params.append(v)
        if not sets:
            return await self.get_by_id(insight_id)
        sets.append("updated_at = CURRENT_TIMESTAMP")
        params.append(insight_id)
        await self.db.execute(f"UPDATE insight SET {', '.join(sets)} WHERE id = ?", params)
        await self.db.commit()
        return await self.get_by_id(insight_id)

    async def confirm(self, insight_id: int) -> dict | None:
        await self.db.execute(
            "UPDATE insight SET confirmed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (insight_id,)
        )
        await self.db.commit()
        return await self.get_by_id(insight_id)

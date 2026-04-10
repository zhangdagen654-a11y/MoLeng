import aiosqlite


class SearchRepo:
    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def rebuild_index(self):
        """全量重建 FTS 索引"""
        await self.db.execute("DELETE FROM fts_content")

        # 索引日记
        rows = await (await self.db.execute("SELECT id, date, content FROM diary")).fetchall()
        for r in rows:
            await self.db.execute(
                "INSERT INTO fts_content (source_type, source_id, title, body) VALUES (?, ?, ?, ?)",
                ("diary", str(r["id"]), r["date"], r["content"]),
            )

        # 索引复盘
        rows = await (await self.db.execute("SELECT id, event, decision, deviation, attribution FROM review")).fetchall()
        for r in rows:
            body = "\n".join(filter(None, [r["event"], r["decision"], r["deviation"], r["attribution"]]))
            await self.db.execute(
                "INSERT INTO fts_content (source_type, source_id, title, body) VALUES (?, ?, ?, ?)",
                ("review", str(r["id"]), r["event"] or "", body),
            )

        # 索引心得
        rows = await (await self.db.execute("SELECT id, knowledge, action FROM insight")).fetchall()
        for r in rows:
            body = "\n".join(filter(None, [r["knowledge"], r["action"]]))
            await self.db.execute(
                "INSERT INTO fts_content (source_type, source_id, title, body) VALUES (?, ?, ?, ?)",
                ("insight", str(r["id"]), r["knowledge"] or "", body),
            )

        await self.db.commit()

    async def search(self, query: str, source_type: str | None = None, limit: int = 20, offset: int = 0) -> list[dict]:
        where = "WHERE fts_content MATCH ?"
        params: list = [query]

        if source_type:
            where += " AND source_type = ?"
            params.append(source_type)

        params.extend([limit, offset])

        rows = await (await self.db.execute(
            f"SELECT source_type, source_id, "
            f"snippet(fts_content, 2, '<mark>', '</mark>', '...', 32) as title_snippet, "
            f"snippet(fts_content, 3, '<mark>', '</mark>', '...', 64) as body_snippet, "
            f"rank "
            f"FROM fts_content {where} "
            f"ORDER BY rank LIMIT ? OFFSET ?",
            params,
        )).fetchall()

        return [dict(r) for r in rows]

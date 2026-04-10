import aiosqlite
from pathlib import Path
from app.config import settings


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(settings.database_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """启动时执行建表 SQL"""
    Path(settings.database_path).parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(settings.database_path)
    db.row_factory = aiosqlite.Row
    try:
        # P0 基础表
        sql_path = Path(__file__).parent / "migrations" / "init.sql"
        sql = sql_path.read_text(encoding="utf-8")
        await db.executescript(sql)

        # P1 FTS5 全文搜索表
        fts_path = Path(__file__).parent / "migrations" / "p1_fts.sql"
        if fts_path.exists():
            fts_sql = fts_path.read_text(encoding="utf-8")
            await db.executescript(fts_sql)

        await db.commit()

        # 重建搜索索引
        from app.repositories.search_repo import SearchRepo
        await SearchRepo(db).rebuild_index()
    finally:
        await db.close()

from datetime import date, timedelta
from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
async def get_stats(period: str = "week"):
    days = 7 if period == "week" else 30
    start_date = (date.today() - timedelta(days=days - 1)).isoformat()

    db = await get_db()
    try:
        # 总数
        review_count = (await (await db.execute(
            "SELECT COUNT(*) FROM review WHERE created_at >= ?", (start_date,)
        )).fetchone())[0]

        insight_count = (await (await db.execute(
            "SELECT COUNT(*) FROM insight WHERE created_at >= ?", (start_date,)
        )).fetchone())[0]

        # 标签分布
        tag_rows = await (await db.execute(
            "SELECT tags FROM review WHERE created_at >= ?", (start_date,)
        )).fetchall()

        tag_dist = {"成功": 0, "失败": 0, "认知迭代": 0}
        for row in tag_rows:
            if row["tags"]:
                for tag in row["tags"].split(","):
                    tag = tag.strip()
                    if tag in tag_dist:
                        tag_dist[tag] += 1

        # 每日统计
        daily_reviews = await (await db.execute(
            "SELECT DATE(created_at) as day, COUNT(*) as count FROM review "
            "WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY day",
            (start_date,)
        )).fetchall()

        daily_insights = await (await db.execute(
            "SELECT DATE(created_at) as day, COUNT(*) as count FROM insight "
            "WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY day",
            (start_date,)
        )).fetchall()

        # 填充完整日期序列
        review_map = {r["day"]: r["count"] for r in daily_reviews}
        insight_map = {r["day"]: r["count"] for r in daily_insights}

        daily_counts = []
        for i in range(days):
            d = (date.today() - timedelta(days=days - 1 - i)).isoformat()
            daily_counts.append({
                "date": d,
                "reviews": review_map.get(d, 0),
                "insights": insight_map.get(d, 0),
            })

        return {
            "review_count": review_count,
            "insight_count": insight_count,
            "tag_distribution": tag_dist,
            "daily_counts": daily_counts,
        }
    finally:
        await db.close()

from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.repositories.diary_repo import DiaryRepo
from app.repositories.review_repo import ReviewRepo
from app.repositories.insight_repo import InsightRepo
from app.repositories.inbox_repo import InboxRepo

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard():
    db = await get_db()
    try:
        inbox_repo = InboxRepo(db)
        diary_repo = DiaryRepo(db)
        review_repo = ReviewRepo(db)
        insight_repo = InsightRepo(db)

        pending_fragments = await inbox_repo.get_pending()
        all_reviews = await review_repo.get_list()
        all_insights = await insight_repo.get_list()

        unconfirmed_reviews = [r for r in all_reviews if not r["confirmed"]]
        unconfirmed_insights = [i for i in all_insights if not i["confirmed"]]

        return {
            "pending_fragments": len(pending_fragments),
            "unconfirmed_reviews": len(unconfirmed_reviews),
            "unconfirmed_insights": len(unconfirmed_insights),
            "total_reviews": len(all_reviews),
            "total_insights": len(all_insights),
        }
    finally:
        await db.close()


@router.get("/trace/{diary_date}")
async def get_trace(diary_date: str):
    """三层溯源：日记 → 复盘 → 心得"""
    db = await get_db()
    try:
        diary_repo = DiaryRepo(db)
        review_repo = ReviewRepo(db)
        insight_repo = InsightRepo(db)

        diary = await diary_repo.get_by_date(diary_date)
        if not diary:
            raise HTTPException(status_code=404, detail="该日期没有日记")

        reviews = await review_repo.get_by_diary_id(diary["id"])
        reviews_with_insights = []
        for review in reviews:
            insights = await insight_repo.get_by_review_id(review["id"])
            reviews_with_insights.append({
                **review,
                "insights": insights,
            })

        return {
            "diary": diary,
            "reviews": reviews_with_insights,
        }
    finally:
        await db.close()

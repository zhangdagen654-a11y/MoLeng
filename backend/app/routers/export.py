import csv
import io
import json
import zipfile
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.database import get_db
from app.repositories.diary_repo import DiaryRepo
from app.repositories.review_repo import ReviewRepo
from app.repositories.insight_repo import InsightRepo

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("")
async def export_data(format: str = "json"):
    if format not in ("json", "csv"):
        raise HTTPException(status_code=400, detail="format 只支持 json 或 csv")

    db = await get_db()
    try:
        diaries = await DiaryRepo(db).get_list()
        reviews = await ReviewRepo(db).get_list()
        insights = await InsightRepo(db).get_list()
    finally:
        await db.close()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if format == "json":
        data = {"diaries": diaries, "reviews": reviews, "insights": insights}
        content = json.dumps(data, ensure_ascii=False, indent=2, default=str)
        return Response(
            content=content.encode("utf-8"),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="export_{timestamp}.json"'},
        )

    # CSV: 打包为 ZIP
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, rows, fields in [
            ("diary", diaries, ["id", "date", "content", "source", "confirmed", "created_at", "updated_at"]),
            ("review", reviews, ["id", "diary_id", "event", "decision", "deviation", "attribution", "tags", "confirmed", "created_at", "updated_at"]),
            ("insight", insights, ["id", "review_id", "knowledge", "action", "related_insight_id", "confirmed", "created_at", "updated_at"]),
        ]:
            csv_buf = io.StringIO()
            writer = csv.DictWriter(csv_buf, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                writer.writerow(row)
            # UTF-8 BOM for Excel
            zf.writestr(f"{name}.csv", "\ufeff" + csv_buf.getvalue())

    return Response(
        content=buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="export_{timestamp}.zip"'},
    )

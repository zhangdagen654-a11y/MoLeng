from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import inbox, diary, review, insight, dashboard, tasks, export, stats, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="认知提纯系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inbox.router)
app.include_router(diary.router)
app.include_router(review.router)
app.include_router(insight.router)
app.include_router(dashboard.router)
app.include_router(tasks.router)
app.include_router(export.router)
app.include_router(stats.router)
app.include_router(search.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/debug/config")
async def debug_config():
    from app.services.ai_service import ai_service
    return {
        "base_url": str(ai_service.client.base_url),
        "model": ai_service.model,
        "key_prefix": settings.anthropic_api_key[:10] + "...",
    }

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    anthropic_base_url: str = "https://api.aisever.cn/v1"
    database_path: str = str(Path(__file__).parent.parent / "data" / "app.db")
    ai_model: str = "claude-opus-4-6"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

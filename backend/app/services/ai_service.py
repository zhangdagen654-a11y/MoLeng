import json
from typing import AsyncGenerator
import anthropic
from app.config import settings
from app.prompts.merge_fragments import MERGE_FRAGMENTS_PROMPT
from app.prompts.extract_reviews import EXTRACT_REVIEWS_PROMPT
from app.prompts.distill_insight import DISTILL_INSIGHT_PROMPT
from app.prompts.analyze_diary import ANALYZE_DIARY_PROMPT
from app.prompts.suggest_insight import SUGGEST_INSIGHT_PROMPT


class AIService:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(
            api_key=settings.anthropic_api_key,
            base_url=settings.anthropic_base_url,
        )
        self.model = settings.ai_model

    async def _call(self, prompt: str) -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()

    async def _stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """流式调用，逐 token yield"""
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def merge_fragments_stream(self, fragments: list[str], extra_content: str | None = None) -> AsyncGenerator[str, None]:
        fragments_text = "\n".join(f"- {f}" for f in fragments)
        extra = f"\n用户额外补充的内容：\n{extra_content}" if extra_content else ""
        prompt = MERGE_FRAGMENTS_PROMPT.format(fragments=fragments_text, extra_content=extra)
        async for token in self._stream(prompt):
            yield token

    async def extract_reviews_stream(self, diary_content: str) -> AsyncGenerator[str, None]:
        prompt = EXTRACT_REVIEWS_PROMPT.format(diary_content=diary_content)
        async for token in self._stream(prompt):
            yield token

    async def distill_insight_stream(self, review: dict, history_insights: list[dict]) -> AsyncGenerator[str, None]:
        history_text = "（暂无历史心得）"
        if history_insights:
            items = []
            for h in history_insights:
                items.append(f"[ID:{h['id']}] 知：{h.get('knowledge', '')} | 行：{h.get('action', '')}")
            history_text = "\n".join(items)
        prompt = DISTILL_INSIGHT_PROMPT.format(
            event=review.get("event", ""),
            decision=review.get("decision", ""),
            deviation=review.get("deviation", ""),
            attribution=review.get("attribution", ""),
            tags=review.get("tags", ""),
            history_insights=history_text,
        )
        async for token in self._stream(prompt):
            yield token

    async def analyze_diary_stream(self, diary_content: str) -> AsyncGenerator[str, None]:
        prompt = ANALYZE_DIARY_PROMPT.format(diary_content=diary_content)
        async for token in self._stream(prompt):
            yield token

    async def suggest_insight_stream(self, review: dict, history_insights: list[dict]) -> AsyncGenerator[str, None]:
        history_text = "（暂无历史心得）"
        if history_insights:
            items = []
            for h in history_insights:
                items.append(f"[ID:{h['id']}] 知：{h.get('knowledge', '')} | 行：{h.get('action', '')}")
            history_text = "\n".join(items)
        prompt = SUGGEST_INSIGHT_PROMPT.format(
            event=review.get("event", ""),
            decision=review.get("decision", ""),
            deviation=review.get("deviation", ""),
            attribution=review.get("attribution", ""),
            tags=review.get("tags", ""),
            history_insights=history_text,
        )
        async for token in self._stream(prompt):
            yield token

    def _parse_json(self, text: str):
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        return json.loads(text.strip())


ai_service = AIService()

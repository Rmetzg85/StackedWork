"""
Drop-in replacement for src/clients/xai_client.py using the Anthropic API directly.

Matches the XAIClient interface so decide.py works without changes:
  - get_completion(prompt, ...) -> str | None
  - get_trading_decision(market_data, portfolio_data, news_summary) -> TradingDecision
  - search(query, max_length) -> str   (stub — returns empty string, news comes from RSS)

Usage: copy this file to src/clients/claude_client.py in the bot repo,
then run apply_patches.sh to wire it in.
"""

from __future__ import annotations

import asyncio
import os
import pickle
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import anthropic

# Re-use the TradingDecision dataclass shape from xai_client
@dataclass
class TradingDecision:
    action: str = "hold"          # "buy" | "sell" | "hold"
    side: str = "no"              # "yes" | "no"
    confidence: float = 0.0       # 0.0 – 1.0
    limit_price: float | None = None
    reasoning: str = ""


@dataclass
class DailyUsageTracker:
    date: str = ""
    total_requests: int = 0
    total_cost_usd: float = 0.0
    exhausted: bool = False
    exhausted_until: float = 0.0


# Approximate cost per 1K tokens for Anthropic models (as of early 2025)
_COST_PER_1K: dict[str, dict[str, float]] = {
    "claude-opus-4-6": {"input": 0.015, "output": 0.075},
    "claude-sonnet-4-6": {"input": 0.003, "output": 0.015},
    "claude-haiku-4-5-20251001": {"input": 0.00025, "output": 0.00125},
}

_TRACKER_PATH = Path("logs/daily_anthropic_usage.pkl")
_DEFAULT_DAILY_LIMIT = float(os.getenv("DAILY_AI_BUDGET_USD", "10.0"))
_PRIMARY_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
_FALLBACK_MODEL = "claude-haiku-4-5-20251001"


class ClaudeClient:
    """
    Anthropic Claude client matching the XAIClient interface used by decide.py.
    """

    def __init__(
        self,
        api_key: str | None = None,
        db_manager: Any = None,
        daily_limit_usd: float = _DEFAULT_DAILY_LIMIT,
    ) -> None:
        self._api_key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
        self._db = db_manager
        self._daily_limit = daily_limit_usd
        self._client = anthropic.AsyncAnthropic(api_key=self._api_key)
        self._tracker = self._load_tracker()

    # ------------------------------------------------------------------
    # Public API (mirrors XAIClient)
    # ------------------------------------------------------------------

    async def get_completion(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.1,
        model: str | None = None,
    ) -> str | None:
        if self._is_exhausted():
            return None

        chosen_model = model or _PRIMARY_MODEL
        try:
            return await self._call(prompt, chosen_model, max_tokens, temperature)
        except Exception:
            try:
                return await self._call(prompt, _FALLBACK_MODEL, max_tokens, temperature)
            except Exception:
                return None

    async def get_trading_decision(
        self,
        market_data: dict,
        portfolio_data: dict | None = None,
        news_summary: str = "",
    ) -> TradingDecision:
        prompt = self._build_decision_prompt(market_data, portfolio_data, news_summary)
        raw = await self.get_completion(prompt, max_tokens=512, temperature=0.1)
        if not raw:
            return TradingDecision()
        return self._parse_decision(raw)

    async def search(self, query: str, max_length: int = 500) -> str:
        """
        XAIClient.search() used live web search via Grok.
        Claude doesn't have built-in search, so we return an empty string —
        the RSS news aggregator already handles market news.
        """
        return ""

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _call(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        for attempt in range(3):
            try:
                resp = await self._client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = resp.content[0].text if resp.content else ""
                self._track_cost(
                    model,
                    resp.usage.input_tokens,
                    resp.usage.output_tokens,
                )
                return text
            except anthropic.RateLimitError:
                await asyncio.sleep(2 ** attempt)
            except anthropic.APIError as exc:
                if attempt == 2:
                    raise
                await asyncio.sleep(2 ** attempt)
        return ""

    def _build_decision_prompt(
        self,
        market_data: dict,
        portfolio_data: dict | None,
        news_summary: str,
    ) -> str:
        title = market_data.get("title", "Unknown market")
        yes_price = market_data.get("yes_ask", market_data.get("last_price", 0.5))
        volume = market_data.get("volume", 0)
        cash = (portfolio_data or {}).get("cash_balance", "unknown")
        return f"""You are a disciplined prediction market trader on Kalshi.

Market: {title}
YES price: {yes_price:.2f}  |  Volume: ${volume:,}  |  Portfolio cash: {cash}
News context: {news_summary or 'None'}

Respond with a JSON object only:
{{
  "action": "buy" | "sell" | "hold",
  "side": "yes" | "no",
  "confidence": <float 0.0-1.0>,
  "limit_price": <float or null>,
  "reasoning": "<one sentence>"
}}

Rules:
- Only recommend buy/sell if confidence >= 0.65
- Prefer NO-side on markets where YES is priced above fair value
- When uncertain, return hold"""

    def _parse_decision(self, raw: str) -> TradingDecision:
        import json, json_repair  # json_repair is in requirements.txt

        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start == -1 or end == 0:
                return TradingDecision()
            blob = raw[start:end]
            data = json.loads(json_repair.repair_json(blob))
            return TradingDecision(
                action=data.get("action", "hold"),
                side=data.get("side", "no"),
                confidence=float(data.get("confidence", 0.0)),
                limit_price=data.get("limit_price"),
                reasoning=data.get("reasoning", ""),
            )
        except Exception:
            return TradingDecision()

    def _track_cost(self, model: str, input_tokens: int, output_tokens: int) -> None:
        rates = _COST_PER_1K.get(model, {"input": 0.003, "output": 0.015})
        cost = (input_tokens / 1000 * rates["input"]) + (output_tokens / 1000 * rates["output"])
        self._tracker.total_cost_usd += cost
        self._tracker.total_requests += 1
        if self._tracker.total_cost_usd >= self._daily_limit:
            self._tracker.exhausted = True
            self._tracker.exhausted_until = _midnight_ts()
        self._save_tracker()

    def _is_exhausted(self) -> bool:
        if not self._tracker.exhausted:
            return False
        if time.time() > self._tracker.exhausted_until:
            self._tracker = DailyUsageTracker()
            self._save_tracker()
            return False
        return True

    def _load_tracker(self) -> DailyUsageTracker:
        try:
            if _TRACKER_PATH.exists():
                with open(_TRACKER_PATH, "rb") as f:
                    return pickle.load(f)
        except Exception:
            pass
        return DailyUsageTracker()

    def _save_tracker(self) -> None:
        try:
            _TRACKER_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(_TRACKER_PATH, "wb") as f:
                pickle.dump(self._tracker, f)
        except Exception:
            pass


def _midnight_ts() -> float:
    import datetime
    now = time.time()
    tomorrow = datetime.datetime.fromtimestamp(now).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    tomorrow = tomorrow.replace(day=tomorrow.day + 1)
    return tomorrow.timestamp()

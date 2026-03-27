# Kalshi AI Trading Bot — Setup Guide

Automated trading system for Kalshi prediction markets using a 5-model AI ensemble
(Grok-3, Claude, GPT-4o, Gemini Flash, DeepSeek R1). Configured for **Disciplined live mode**.

Source: https://github.com/ryanfrigo/kalshi-ai-trading-bot

---

## Prerequisites

- Python 3.12+
- Kalshi account with API access enabled
- **Anthropic API key** (replaces Grok-3 as the forecaster model) — https://console.anthropic.com/
- OpenRouter API key (for GPT-4o/Gemini/DeepSeek — 3 of the 5 ensemble models) — https://openrouter.ai/

> **No xAI account needed.** The `apply_patches.sh` script swaps the Grok-3 slot for Claude Sonnet/Opus via the Anthropic API directly.

---

## Step 1: Generate Your Kalshi API Key

1. Log in to https://trading.kalshi.com
2. Go to **Settings → API**
3. Click **Generate New Key**
4. Download the **RSA private key** (`.pem` file) — save it somewhere secure
5. Copy the **Key ID** shown on screen

---

## Step 2: Clone the Bot and Apply Patches

```bash
# From the trading-bot/ directory:
bash setup.sh /path/to/kalshi_private_key.pem
bash apply_patches.sh
```

The patches replace the Grok-3/xAI dependency with Claude via the Anthropic API.

---

## Step 3: Python Environment

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Step 4: Configure Environment Variables

Copy the template and fill in your credentials:

```bash
cp .env.template .env
```

Then edit `.env` — see the annotated template in this directory (`env.template.annotated`) for
exactly what each variable means and which values to use for Disciplined mode.

Move your Kalshi private key file into the project directory:

```bash
cp /path/to/your-kalshi-private-key.pem kalshi_private_key.pem
```

---

## Step 5: Verify Setup

```bash
python cli.py health
```

This checks all API connections without placing any trades.

---

## Step 6: Run in Paper Mode First (Recommended)

Even though you intend to trade live, run paper mode for at least one day to confirm
the bot is finding and analyzing markets correctly:

```bash
python cli.py run --paper
```

---

## Step 7: Go Live (Disciplined Mode)

```bash
python cli.py run --mode disciplined
```

---

## Disciplined Mode Limits (Pre-configured)

| Setting | Value |
|---------|-------|
| Max position size | 3% of portfolio |
| Min AI confidence | 65% |
| Daily loss limit | 15% (hard stop) |
| Max drawdown | 15% |
| Daily AI API budget | $10 |
| Min market volume | $200 |
| Kelly fraction | 0.75x (conservative) |

---

## Monitoring

```bash
python cli.py dashboard          # live performance dashboard
python cli.py stats              # trade history and P&L
```

---

## Safety Notes

- The bot will **hard-stop** if daily losses hit 15% of your portfolio
- Economic markets (CPI, Fed decisions) have historically underperformed despite high AI confidence — the Disciplined mode applies a 1.15x multiplier but the category scorer may still block these
- Never run Beast Mode with real money — it "leads to significant losses" per the original authors

---

## API Key Cost Estimates

| Service | Role | Typical cost |
|---------|------|-------------|
| Anthropic (Claude Sonnet) | Forecaster — 30% weight | ~$1–4/day |
| OpenRouter | GPT-4o, Gemini, DeepSeek — 70% weight | ~$1–3/day |
| **Total AI overhead** | | **Capped at $10/day by default** |

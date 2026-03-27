# Kalshi AI Trading Bot — Setup Guide

Automated trading system for Kalshi prediction markets using a 5-model AI ensemble
(Grok-3, Claude, GPT-4o, Gemini Flash, DeepSeek R1). Configured for **Disciplined live mode**.

Source: https://github.com/ryanfrigo/kalshi-ai-trading-bot

---

## Prerequisites

- Python 3.12+
- Kalshi account with API access enabled
- xAI API key (for Grok-3) — https://console.x.ai/
- OpenRouter API key (for Claude/GPT-4o/Gemini/DeepSeek) — https://openrouter.ai/

---

## Step 1: Generate Your Kalshi API Key

1. Log in to https://trading.kalshi.com
2. Go to **Settings → API**
3. Click **Generate New Key**
4. Download the **RSA private key** (`.pem` file) — save it somewhere secure
5. Copy the **Key ID** shown on screen

---

## Step 2: Clone the Bot

```bash
git clone https://github.com/ryanfrigo/kalshi-ai-trading-bot.git
cd kalshi-ai-trading-bot
```

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

| Service | Typical cost |
|---------|-------------|
| xAI (Grok-3) | ~$5–15/day depending on volume |
| OpenRouter | ~$2–8/day (routes to cheapest model per query) |
| Total AI overhead | Capped at $10/day by default config |

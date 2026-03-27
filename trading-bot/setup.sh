#!/usr/bin/env bash
# =============================================================================
# Kalshi AI Trading Bot — One-command setup script
# Usage: bash setup.sh [path-to-kalshi-private-key.pem]
# =============================================================================
set -e

REPO_URL="https://github.com/ryanfrigo/kalshi-ai-trading-bot.git"
BOT_DIR="kalshi-ai-trading-bot"
PRIVATE_KEY_ARG="${1:-}"

echo ""
echo "=========================================="
echo "  Kalshi AI Trading Bot Setup"
echo "=========================================="
echo ""

# --- Python version check ---
PYTHON=$(command -v python3.12 2>/dev/null || command -v python3 2>/dev/null || "")
if [ -z "$PYTHON" ]; then
  echo "ERROR: Python 3.12+ is required. Install it from https://python.org"
  exit 1
fi

PY_VERSION=$($PYTHON -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PY_MAJOR=$(echo "$PY_VERSION" | cut -d. -f1)
PY_MINOR=$(echo "$PY_VERSION" | cut -d. -f2)

if [ "$PY_MAJOR" -lt 3 ] || ([ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 12 ]); then
  echo "ERROR: Python 3.12+ is required (found $PY_VERSION). Install it from https://python.org"
  exit 1
fi

echo "[1/5] Python $PY_VERSION detected ✓"

# --- Clone repo ---
if [ -d "$BOT_DIR" ]; then
  echo "[2/5] '$BOT_DIR' already exists — skipping clone, pulling latest..."
  cd "$BOT_DIR"
  git pull origin main
else
  echo "[2/5] Cloning $REPO_URL..."
  git clone "$REPO_URL"
  cd "$BOT_DIR"
fi

# --- Virtual environment ---
echo "[3/5] Creating Python virtual environment..."
$PYTHON -m venv .venv
source .venv/bin/activate

echo "[4/5] Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "      Dependencies installed ✓"

# --- Environment file ---
if [ ! -f ".env" ]; then
  echo "[5/5] Creating .env from template..."
  cp .env.template .env
  echo ""
  echo "  !! IMPORTANT: Edit .env with your credentials before running the bot."
  echo "  !! See ../env.template.annotated for a fully annotated guide."
  echo ""
else
  echo "[5/5] .env already exists — skipping (not overwritten)"
fi

# --- Copy private key if provided ---
if [ -n "$PRIVATE_KEY_ARG" ]; then
  if [ -f "$PRIVATE_KEY_ARG" ]; then
    cp "$PRIVATE_KEY_ARG" kalshi_private_key.pem
    echo "  Kalshi private key copied to kalshi_private_key.pem ✓"
    # Update .env to point to it
    if grep -q "KALSHI_PRIVATE_KEY_PATH" .env; then
      sed -i 's|KALSHI_PRIVATE_KEY_PATH=.*|KALSHI_PRIVATE_KEY_PATH=./kalshi_private_key.pem|' .env
    fi
  else
    echo "  WARNING: '$PRIVATE_KEY_ARG' not found — skipping key copy"
  fi
fi

# --- Create data/logs directories ---
mkdir -p data logs

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. cd $BOT_DIR"
echo "  2. source .venv/bin/activate"
echo "  3. Edit .env — fill in your API keys"
echo "     (see ../env.template.annotated for guidance)"
echo ""
echo "  4. Test connections:"
echo "     python cli.py health"
echo ""
echo "  5. Run paper mode first to verify:"
echo "     python cli.py run --paper"
echo ""
echo "  6. When ready for live Disciplined mode:"
echo "     python cli.py run --mode disciplined"
echo ""
echo "  API keys you still need:"
echo "    - xAI (Grok-3):   https://console.x.ai/"
echo "    - OpenRouter:      https://openrouter.ai/keys"
echo ""

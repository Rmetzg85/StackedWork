#!/usr/bin/env bash
# =============================================================================
# Apply Claude-for-Grok patches to the kalshi-ai-trading-bot repo.
# Run this from the trading-bot/ directory AFTER setup.sh has cloned the bot.
#
# Usage: bash apply_patches.sh
# =============================================================================
set -e

BOT_DIR="kalshi-ai-trading-bot"
PATCHES_DIR="$(cd "$(dirname "$0")/patches" && pwd)"

if [ ! -d "$BOT_DIR" ]; then
  echo "ERROR: '$BOT_DIR' not found. Run setup.sh first."
  exit 1
fi

echo ""
echo "=========================================="
echo "  Applying Claude-for-Grok patches"
echo "=========================================="
echo ""

# 1. Drop in the Claude client (replaces xai role)
echo "[1/4] Installing claude_client.py..."
cp "$PATCHES_DIR/claude_client.py" "$BOT_DIR/src/clients/claude_client.py"
echo "      Done ✓"

# 2. Patch decide.py: replace xai_client imports and usage with claude_client
echo "[2/4] Patching src/jobs/decide.py..."
DECIDE="$BOT_DIR/src/jobs/decide.py"

if grep -q "xai_client" "$DECIDE"; then
  # Replace import
  sed -i 's/from src\.clients\.xai_client import XAIClient/from src.clients.claude_client import ClaudeClient/' "$DECIDE"
  sed -i 's/from clients\.xai_client import XAIClient/from clients.claude_client import ClaudeClient/' "$DECIDE"
  # Replace instantiation
  sed -i 's/XAIClient(/ClaudeClient(/' "$DECIDE"
  # Replace variable name if they used xai_client as a variable
  sed -i 's/xai_client\b/claude_client/g' "$DECIDE"
  echo "      Patched xai_client -> claude_client ✓"
else
  echo "      No xai_client reference found in decide.py — skipping (may already be patched)"
fi

# 3. Patch model_router.py: add Claude as a direct provider
echo "[3/4] Patching src/clients/model_router.py..."
ROUTER="$BOT_DIR/src/clients/model_router.py"

if grep -q "xai" "$ROUTER" && ! grep -q "claude_client" "$ROUTER"; then
  # Add ClaudeClient import after existing imports
  sed -i '/from.*xai_client.*import/a from clients.claude_client import ClaudeClient' "$ROUTER"
  # Replace XAIClient instantiation with ClaudeClient in __init__
  sed -i 's/self\.xai_client\s*=\s*XAIClient(/self.claude_client = ClaudeClient(/' "$ROUTER"
  # Route any "xai" or "grok" provider dispatch to claude_client
  sed -i 's/self\.xai_client\b/self.claude_client/g' "$ROUTER"
  echo "      Patched model_router.py ✓"
else
  echo "      model_router.py already patched or no xai reference — skipping"
fi

# 4. Patch settings.py: add ANTHROPIC_API_KEY, remove XAI requirement
echo "[4/4] Patching src/config/settings.py..."
SETTINGS="$BOT_DIR/src/config/settings.py"

if grep -q "xai_api_key\|XAI_API_KEY" "$SETTINGS" && ! grep -q "anthropic_api_key\|ANTHROPIC_API_KEY" "$SETTINGS"; then
  sed -i 's/XAI_API_KEY/ANTHROPIC_API_KEY/g' "$SETTINGS"
  sed -i 's/xai_api_key/anthropic_api_key/g' "$SETTINGS"
  sed -i 's/xai_base_url/anthropic_base_url/g' "$SETTINGS"
  echo "      Patched settings.py: XAI_API_KEY -> ANTHROPIC_API_KEY ✓"
else
  echo "      settings.py already has ANTHROPIC_API_KEY or no XAI ref — skipping"
fi

echo ""
echo "=========================================="
echo "  Patches applied!"
echo "=========================================="
echo ""
echo "Your .env now needs:"
echo ""
echo "  KALSHI_API_KEY=<your Kalshi key ID>"
echo "  KALSHI_PRIVATE_KEY_PATH=./kalshi_private_key.pem"
echo "  ANTHROPIC_API_KEY=<your Anthropic key>   # replaces XAI_API_KEY"
echo "  OPENROUTER_API_KEY=<your OpenRouter key>  # still needed for GPT-4o/Gemini/DeepSeek"
echo "  ANTHROPIC_MODEL=claude-sonnet-4-6         # or claude-opus-4-6 for more accuracy"
echo "  LIVE_TRADING=true"
echo ""
echo "No xAI account needed."
echo ""
echo "Model costs with this setup:"
echo "  Anthropic (forecaster role, 30%): ~\$1-4/day at $10 cap"
echo "  OpenRouter (4 other models):      ~\$1-3/day"
echo ""
echo "Next: edit .env, then run:"
echo "  cd $BOT_DIR && source .venv/bin/activate"
echo "  python cli.py health"
echo "  python cli.py run --paper"
echo ""

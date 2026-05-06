#!/bin/bash

echo "🚀 Starting Telegram Bot..."
echo "=========================="
echo ""

cd "$(dirname "$0")"

# Check if bot.py exists
if [ ! -f "bot.py" ]; then
    echo "❌ Error: bot.py not found"
    exit 1
fi

# Kill any existing bot process
pkill -f "python.*bot.py" 2>/dev/null
sleep 1

# Start bot
echo "Starting bot process..."
python bot.py

echo ""
echo "=========================="
echo "Bot stopped"

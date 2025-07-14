#!/bin/bash

# WhatsApp AI Bot Startup Script
echo "🚀 Starting WhatsApp AI Bot..."

# Stop any existing Python processes
pkill -f gunicorn 2>/dev/null || true
pkill -f "python main.py" 2>/dev/null || true
pkill -f "python app.py" 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Kill any existing Node.js processes for this bot
pkill -f "node index.js" 2>/dev/null || true

# Start Node.js application
echo "📱 Starting Node.js WhatsApp Bot with Baileys..."
echo "🌐 Web dashboard will be available on port 3000"
echo "📱 WhatsApp QR code will appear once connected"
echo ""

# Run the bot
node index.js
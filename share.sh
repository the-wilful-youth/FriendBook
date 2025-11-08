#!/bin/bash

echo "🌐 FriendBook Remote Access Setup"
echo "================================="

# Kill any existing processes
pkill -f "node server.js" 2>/dev/null
pkill -f "ngrok" 2>/dev/null

# Start the server with environment variables
echo "🚀 Starting FriendBook server with online database..."
cd web

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Load environment variables and start server
if [ -f .env ]; then
    export $(cat .env | xargs)
    echo "✅ Loaded online database configuration"
else
    echo "⚠️  No .env file found, using local database"
fi

# Start server in background
node server.js &
SERVER_PID=$!
cd ..

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running on different ports
PORT=3000
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    PORT=3000
elif curl -s http://localhost:3001 > /dev/null 2>&1; then
    PORT=3001
else
    echo "❌ Server failed to start. Check for errors above."
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ Server running on port $PORT"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install ngrok/ngrok/ngrok
    else
        echo "Please install Homebrew first or install ngrok manually"
        echo "Local access only: http://localhost:$PORT"
        wait $SERVER_PID
        exit 0
    fi
fi

# Start ngrok
echo "📡 Starting ngrok tunnel..."
ngrok http localhost:$PORT &
NGROK_PID=$!

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo ""
echo "✅ FriendBook is now accessible with online database!"
echo ""
echo "🏠 Local: http://localhost:$PORT"
echo "📱 Network: http://$LOCAL_IP:$PORT"
echo "🌍 Public: Check ngrok output above for the https:// URL"
echo ""
echo "🔐 Default login: admin / admin123"
echo "📋 Share the ngrok https:// URL with your friends!"
echo "🛑 Press Ctrl+C to stop"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    exit 0
}

trap cleanup INT
wait

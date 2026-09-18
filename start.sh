#!/bin/bash
# start.sh — Start both backend and frontend for Stickman Arena

echo "🎮 Starting Stickman Arena Duel..."
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing processes on port 3001 and 5173
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend
echo "🖥️  Starting backend on port 3001..."
cd "$ROOT_DIR/backend"
node server.js &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "🌐 Starting frontend on port 5173..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "📺 Capture http://localhost:5173 di OBS/TikTok Live Studio"
echo "   Resolution: 1080x1920 (9:16 vertikal)"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for interrupt
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait


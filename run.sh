#!/bin/bash

# Simple startup script for Million Pixel Wall

echo "╔════════════════════════════════════════════╗"
echo "║  Million Pixel Wall - Quick Start          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Kill any existing servers
pkill -f 'node server.js' 2>/dev/null
pkill -f 'http.server 8000' 2>/dev/null
sleep 1

# Start backend
echo "Starting backend server on port 3000..."
cd backend
node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

# Check backend
if curl -s http://localhost:3000/api/ads/stats > /dev/null 2>&1; then
    echo "✓ Backend is running (PID: $BACKEND_PID)"
else
    echo "✗ Backend failed to start"
    exit 1
fi

# Start frontend
echo "Starting frontend server on port 8000..."
python3 -m http.server 8000 > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 1

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Servers Started Successfully!             ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📱 Frontend: http://localhost:8000"
echo "🔌 Backend API: http://localhost:3000"
echo "🛒 Purchase Page: http://localhost:8000/purchase.html"
echo "📊 API Stats: http://localhost:3000/api/ads/stats"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo ""

# Wait for interrupt
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Keep script running
wait

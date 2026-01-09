#!/bin/bash

# Million Pixel Wall - Start Script
# This script starts both backend and frontend servers

echo "╔════════════════════════════════════════════╗"
echo "║  Million Pixel Wall - Startup Script      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo ""
fi

# Check if database is migrated
echo -e "${YELLOW}Checking database status...${NC}"
cd backend
node -e "
const db = require('./config/database');
db.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \\'ads\\')')
  .then(res => {
    if (res.rows[0].exists) {
      console.log('✓ Database tables exist');
      process.exit(0);
    } else {
      console.log('⚠ Database not migrated. Running migrations...');
      process.exit(1);
    }
  })
  .catch(err => {
    console.log('⚠ Could not connect to database');
    console.log('Please check backend/TROUBLESHOOTING.md for help');
    process.exit(2);
  });
" 2>/dev/null
DB_STATUS=$?
cd ..

if [ $DB_STATUS -eq 1 ]; then
    echo "Running database migrations..."
    cd backend
    npm run migrate
    cd ..
elif [ $DB_STATUS -eq 2 ]; then
    echo -e "${RED}Cannot connect to database!${NC}"
    echo "Please check:"
    echo "  1. Is your Neon database active? (may be sleeping)"
    echo "  2. Is the DATABASE_URL correct in backend/.env?"
    echo "  3. See backend/TROUBLESHOOTING.md for solutions"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Starting servers...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend on http://localhost:3000..."
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check backend.log${NC}"
    cat backend.log
    exit 1
fi

# Start frontend
echo "Starting frontend on http://localhost:8000..."
python3 -m http.server 8000 > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 1

# Check if frontend started successfully
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check frontend.log${NC}"
    cat frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║            All servers running!            ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Frontend: http://localhost:8000           ║"
echo "║  Backend:  http://localhost:3000           ║"
echo "║  API Docs: backend/API_DOCUMENTATION.md    ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Press Ctrl+C to stop all servers          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Open browser (optional)
if command -v xdg-open > /dev/null; then
    echo "Opening browser..."
    xdg-open http://localhost:8000 2>/dev/null
elif command -v open > /dev/null; then
    echo "Opening browser..."
    open http://localhost:8000 2>/dev/null
fi

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID

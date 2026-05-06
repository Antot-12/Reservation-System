#!/bin/bash

# Start both backend and frontend servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Doctor Appointment Booking System...${NC}"

# Start backend in background
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend in background
echo -e "${BLUE}Starting frontend server...${NC}"
cd ../frontend
npm start &
FRONTEND_PID=$!

echo -e "${GREEN}Servers started!${NC}"
echo -e "Backend: http://localhost:8000"
echo -e "Frontend: http://localhost:3000"
echo -e "API Docs: http://localhost:8000/docs"
echo ""
echo -e "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

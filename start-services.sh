#!/bin/bash

# Start Services Script for GreenPulse
echo "🚀 Starting GreenPulse Services..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check ports
echo "🔍 Checking required ports..."
check_port 3000 || echo "   Backend (3000) may already be running"
check_port 8000 || echo "   FastAPI (8000) may already be running"

# Start FastAPI in background
echo "🤖 Starting FastAPI ML service (port 8000)..."
cd backend
python3 fastapis.py &
FASTAPI_PID=$!
echo "   FastAPI PID: $FASTAPI_PID"

# Wait a moment for FastAPI to start
sleep 3

# Start Node.js backend in background
echo "🔧 Starting Node.js backend (port 3000)..."
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Go back to root and start frontend
echo "⚡ Starting React frontend (port 5173)..."
cd ..
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ All services started!"
echo "📊 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3000"
echo "🤖 FastAPI:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $FASTAPI_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for user interrupt
wait
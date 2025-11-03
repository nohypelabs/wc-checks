#!/bin/bash

# Development script - runs both API and frontend

echo "🚀 Starting development servers..."
echo ""
echo "📡 API Server: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Trap Ctrl+C to kill all processes
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start Vercel dev for API on port 3001
echo "[API] Starting Vercel dev..."
vercel dev --listen 3001 &
API_PID=$!

# Wait a bit for Vercel to start
sleep 3

# Start Vite dev server on port 5174
echo "[UI] Starting Vite dev..."
npm run dev &
VITE_PID=$!

# Wait for both processes
wait $API_PID $VITE_PID

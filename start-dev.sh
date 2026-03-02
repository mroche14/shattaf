#!/bin/bash

# ===========================================
# Shattaf Marketplace - Development Launcher
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${CYAN}"
echo "  ___  _           _   _         __  "
echo " / __|| |_   __ _ | |_| |_  __ _ / _| "
echo " \__ \| ' \ / _\` ||  _|  _|/ _\` ||  _| "
echo " |___/|_||_|\__,_| \__|\__|\__,_||_|   "
echo -e "${NC}"
echo -e "${GREEN}Shattaf Marketplace - Dev Launcher${NC}"
echo ""

# ---------------------------------------------
# Check prerequisites
# ---------------------------------------------
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "  ✓ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}  pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "  ✓ pnpm $(pnpm -v)"

# Check uv
if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}  uv not found. Installing...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/env 2>/dev/null || true
fi
echo -e "  ✓ uv $(uv --version)"

# Check and start PostgreSQL via Docker
if command -v docker &> /dev/null; then
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "shattaf-db"; then
        echo -e "${YELLOW}  Starting PostgreSQL container...${NC}"
        docker compose up -d db 2>/dev/null || docker-compose up -d db 2>/dev/null || true
        # Wait for PostgreSQL to be ready
        echo -n "  Waiting for PostgreSQL"
        for i in {1..30}; do
            if docker exec shattaf-db pg_isready -U postgres &>/dev/null; then
                echo -e "\n  ✓ PostgreSQL ready"
                break
            fi
            echo -n "."
            sleep 1
        done
    else
        echo -e "  ✓ PostgreSQL container running"
    fi
else
    echo -e "${YELLOW}  ⚠ Docker not found. Make sure PostgreSQL is running on localhost:5434${NC}"
fi

# ---------------------------------------------
# Install frontend dependencies
# ---------------------------------------------
echo ""
echo -e "${YELLOW}[2/6] Installing frontend dependencies...${NC}"
pnpm install

# ---------------------------------------------
# Setup Python virtual environment with uv
# ---------------------------------------------
echo ""
echo -e "${YELLOW}[3/6] Setting up Python backend with uv...${NC}"

cd "$PROJECT_ROOT/apps/api"

if [ ! -d ".venv" ]; then
    echo "  Creating virtual environment..."
    uv venv
fi

echo "  Installing Python dependencies..."
uv pip install -r requirements.txt

# ---------------------------------------------
# Create database if not exists
# ---------------------------------------------
echo ""
echo -e "${YELLOW}[4/6] Checking database...${NC}"

# Try to create database (ignore error if exists)
if command -v createdb &> /dev/null; then
    createdb -h localhost -p 5434 -U postgres shattaf 2>/dev/null && echo "  ✓ Database 'shattaf' created" || echo "  ✓ Database 'shattaf' already exists"
else
    echo -e "${YELLOW}  ⚠ Cannot auto-create database. Make sure 'shattaf' database exists.${NC}"
    echo "    Run: createdb -U postgres shattaf"
fi

# ---------------------------------------------
# Run migrations
# ---------------------------------------------
echo ""
echo -e "${YELLOW}[5/6] Running database migrations...${NC}"

cd "$PROJECT_ROOT/apps/api"

# Check if alembic is configured
if [ -f "alembic.ini" ]; then
    uv run alembic upgrade head 2>/dev/null && echo "  ✓ Migrations applied" || echo -e "${YELLOW}  ⚠ Migration failed (database might not be ready)${NC}"
else
    echo "  ⚠ Alembic not configured yet"
fi

# ---------------------------------------------
# Start all services
# ---------------------------------------------
echo ""
echo -e "${YELLOW}[6/6] Starting all services...${NC}"
echo ""
echo -e "${GREEN}Starting services in background...${NC}"
echo ""

cd "$PROJECT_ROOT"

# Kill any existing processes on our ports
kill $(lsof -t -i:8010) 2>/dev/null || true
kill $(lsof -t -i:3003) 2>/dev/null || true
kill $(lsof -t -i:3001) 2>/dev/null || true
kill $(lsof -t -i:3002) 2>/dev/null || true

# Create logs directory
mkdir -p "$PROJECT_ROOT/.logs"

# Start API with uv
echo -e "  ${CYAN}Starting API on http://localhost:8010${NC}"
cd "$PROJECT_ROOT/apps/api"
nohup uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8010 > "$PROJECT_ROOT/.logs/api.log" 2>&1 &
API_PID=$!
echo "    PID: $API_PID"

# Wait for API to be ready
sleep 2

# Start frontends
cd "$PROJECT_ROOT"
echo -e "  ${CYAN}Starting web-client on http://localhost:3003${NC}"
PNPM_BIN="$(which pnpm)"
nohup "$PNPM_BIN" --filter=web-client dev > "$PROJECT_ROOT/.logs/web-client.log" 2>&1 &
CLIENT_PID=$!
echo "    PID: $CLIENT_PID"

echo -e "  ${CYAN}Starting web-pro on http://localhost:3001${NC}"
nohup "$PNPM_BIN" --filter=web-pro dev > "$PROJECT_ROOT/.logs/web-pro.log" 2>&1 &
PRO_PID=$!
echo "    PID: $PRO_PID"

echo -e "  ${CYAN}Starting web-admin on http://localhost:3002${NC}"
nohup "$PNPM_BIN" --filter=web-admin dev > "$PROJECT_ROOT/.logs/web-admin.log" 2>&1 &
ADMIN_PID=$!
echo "    PID: $ADMIN_PID"

# Save PIDs for stop script
echo "$API_PID" > "$PROJECT_ROOT/.logs/api.pid"
echo "$CLIENT_PID" > "$PROJECT_ROOT/.logs/web-client.pid"
echo "$PRO_PID" > "$PROJECT_ROOT/.logs/web-pro.pid"
echo "$ADMIN_PID" > "$PROJECT_ROOT/.logs/web-admin.pid"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  All services started!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}API:${NC}        http://localhost:8010"
echo -e "  ${CYAN}API Docs:${NC}   http://localhost:8010/docs"
echo -e "  ${CYAN}Client:${NC}     http://localhost:3003"
echo -e "  ${CYAN}Pro:${NC}        http://localhost:3001"
echo -e "  ${CYAN}Admin:${NC}      http://localhost:3002"
echo ""
echo -e "  Logs: ${PROJECT_ROOT}/.logs/"
echo ""
echo -e "  To stop: ${YELLOW}./stop-dev.sh${NC}"
echo ""

# ---------------------------------------------
# Open browsers with auto-login
# ---------------------------------------------
echo -e "${YELLOW}Opening browsers with auto-login...${NC}"
echo -e "  Waiting for dev servers to be ready..."
sleep 5

"$PROJECT_ROOT/open-browsers.sh"

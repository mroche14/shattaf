#!/bin/bash

# ===========================================
# Shattaf Marketplace - Stop Development
# ===========================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Shattaf services...${NC}"

# Kill by saved PIDs
if [ -f "$PROJECT_ROOT/.logs/api.pid" ]; then
    kill $(cat "$PROJECT_ROOT/.logs/api.pid") 2>/dev/null && echo "  ✓ API stopped"
    rm "$PROJECT_ROOT/.logs/api.pid"
fi

if [ -f "$PROJECT_ROOT/.logs/web-client.pid" ]; then
    kill $(cat "$PROJECT_ROOT/.logs/web-client.pid") 2>/dev/null && echo "  ✓ web-client stopped"
    rm "$PROJECT_ROOT/.logs/web-client.pid"
fi

if [ -f "$PROJECT_ROOT/.logs/web-pro.pid" ]; then
    kill $(cat "$PROJECT_ROOT/.logs/web-pro.pid") 2>/dev/null && echo "  ✓ web-pro stopped"
    rm "$PROJECT_ROOT/.logs/web-pro.pid"
fi

if [ -f "$PROJECT_ROOT/.logs/web-admin.pid" ]; then
    kill $(cat "$PROJECT_ROOT/.logs/web-admin.pid") 2>/dev/null && echo "  ✓ web-admin stopped"
    rm "$PROJECT_ROOT/.logs/web-admin.pid"
fi

# Also kill by port (backup)
kill $(lsof -t -i:8010) 2>/dev/null || true
kill $(lsof -t -i:3003) 2>/dev/null || true
kill $(lsof -t -i:3001) 2>/dev/null || true
kill $(lsof -t -i:3002) 2>/dev/null || true

echo -e "${GREEN}All services stopped.${NC}"

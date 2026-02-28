#!/bin/bash
# Open browser with all Shattaf apps (auto-login enabled by default)
#
# Usage:
#   ./open-browsers.sh              # Open + auto-login all accounts
#   ./open-browsers.sh --no-login   # Open without auto-login
#   ./open-browsers.sh --no-detach  # Keep script running until browser closes

cd "$(dirname "${BASH_SOURCE[0]}")"

# Use the API venv which has playwright
if [ -f "apps/api/.venv/bin/python" ]; then
    PYTHON="apps/api/.venv/bin/python"
elif [ -f "apps/api/venv/bin/python" ]; then
    PYTHON="apps/api/venv/bin/python"
else
    PYTHON="python3"
fi

# Check if playwright is installed, install if not
$PYTHON -c "import playwright" 2>/dev/null || {
    echo "Installing playwright..."
    $PYTHON -m pip install playwright
    $PYTHON -m playwright install chromium
}

# Run the browser script (pass all args through)
$PYTHON scripts/open-browsers.py "$@"

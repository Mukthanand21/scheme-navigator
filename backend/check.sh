#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================"
echo "🛡️  Running Backend DX Checks (Ruff & Mypy) 🛡️"
echo "========================================"

# Activate virtual environment if not already active
if [ -z "$VIRTUAL_ENV" ]; then
    if [ -d ".venv" ]; then
        echo "🔌 Activating virtual environment (.venv)..."
        source .venv/bin/activate
    else
        echo "⚠️  No .venv folder found. Running tools globally/system..."
    fi
fi

echo ""
echo "🧹 1. Running Ruff Formatter (dry-run)..."
ruff format --check .

echo ""
echo "🔍 2. Running Ruff Linter..."
ruff check .

echo ""
echo "🏷️  3. Running Mypy Type Checker..."
mypy .

echo ""
echo "✅ All backend DX checks passed successfully!"

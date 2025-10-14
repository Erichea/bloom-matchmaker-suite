#!/bin/bash

# RLS Test Runner Script
# Usage: ./tests/rls/run_tests.sh

set -e

echo "========================================="
echo "Running RLS Test Suite"
echo "========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it with your Supabase connection string:"
    echo "export DATABASE_URL='postgresql://postgres:[password]@[host]:[port]/postgres'"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql is not installed"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "- macOS: brew install postgresql"
    echo "- Ubuntu: sudo apt-get install postgresql-client"
    echo "- Windows: Install from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ Environment checks passed"
echo ""

# Run the tests
echo "Running profile_answers RLS tests..."
echo "========================================="
echo ""

psql "$DATABASE_URL" -f "$(dirname "$0")/profile_answers.test.sql"

echo ""
echo "========================================="
echo "Test suite complete!"
echo "========================================="
echo ""
echo "Review the output above:"
echo "- All tests should show ✅ PASS"
echo "- Any ❌ FAIL indicates a security issue"
echo ""

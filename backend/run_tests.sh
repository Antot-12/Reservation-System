#!/bin/bash

# Test Runner Script for Medical Appointment Booking System
# Usage: ./run_tests.sh [options]

set -e

echo "🧪 Medical Appointment Booking System - Test Suite"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default options
COVERAGE=false
PARALLEL=false
VERBOSE=false
SPECIFIC_TEST=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --parallel|-p)
            PARALLEL=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./run_tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  -c, --coverage    Run with coverage report"
            echo "  -p, --parallel    Run tests in parallel"
            echo "  -v, --verbose     Verbose output"
            echo "  -t, --test NAME   Run specific test class or method"
            echo "  -h, --help        Show this help"
            echo ""
            echo "Examples:"
            echo "  ./run_tests.sh                          # Run all tests"
            echo "  ./run_tests.sh --coverage               # Run with coverage"
            echo "  ./run_tests.sh --parallel               # Run in parallel"
            echo "  ./run_tests.sh -t TestAuthentication    # Run specific test class"
            echo "  ./run_tests.sh -t test_send_otp_success # Run specific test"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}❌ pytest is not installed${NC}"
    echo "Install with: pip install -r requirements-test.txt"
    exit 1
fi

# Clean old test artifacts
echo "🧹 Cleaning old test artifacts..."
rm -f test.db
rm -rf .pytest_cache
rm -rf htmlcov
rm -f .coverage

# Build pytest command
PYTEST_CMD="pytest tests/test_smoke.py"

if [ "$VERBOSE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -v -s"
else
    PYTEST_CMD="$PYTEST_CMD -v"
fi

if [ "$COVERAGE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=html --cov-report=term-missing"
fi

if [ "$PARALLEL" = true ]; then
    # Check if pytest-xdist is installed
    if ! python -c "import xdist" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  pytest-xdist not installed. Installing...${NC}"
        pip install pytest-xdist
    fi
    PYTEST_CMD="$PYTEST_CMD -n auto"
fi

if [ -n "$SPECIFIC_TEST" ]; then
    PYTEST_CMD="$PYTEST_CMD -k $SPECIFIC_TEST"
fi

# Run tests
echo ""
echo -e "${YELLOW}📝 Running tests...${NC}"
echo "Command: $PYTEST_CMD"
echo ""

if $PYTEST_CMD; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"

    if [ "$COVERAGE" = true ]; then
        echo ""
        echo -e "${GREEN}📊 Coverage report generated: htmlcov/index.html${NC}"
        echo "Open with: open htmlcov/index.html"
    fi

    exit 0
else
    echo ""
    echo -e "${RED}❌ Tests failed!${NC}"
    exit 1
fi

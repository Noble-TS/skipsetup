#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Type checking
echo "  Type checking..."
pnpm type-check
if [ $? -ne 0 ]; then
  echo "  ❌ TypeScript errors found"
  exit 1
fi

# Linting
echo "  Linting..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "  ❌ ESLint errors found"
  exit 1
fi

# Tests
echo "  Running tests..."
pnpm test --passWithNoTests
if [ $? -ne 0 ]; then
  echo "  ❌ Tests failed"
  exit 1
fi

echo "  ✅ All pre-commit checks passed!"

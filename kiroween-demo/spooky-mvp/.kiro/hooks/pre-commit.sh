#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Type checking
echo " Type checking..."
pnpm tsc --noEmit

if [ $? -ne 0 ]; then
  echo " TypeScript errors found"
  exit 1
fi

# Linting
echo " Linting..."
pnpm lint

if [ $? -ne 0 ]; then
  echo " ESLint errors found"
  exit 1
fi

# Tests
echo " Running tests..."
pnpm test --passWithNoTests

echo " All pre-commit checks passed!"

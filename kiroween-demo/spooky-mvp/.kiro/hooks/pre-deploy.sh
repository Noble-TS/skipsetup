#!/bin/bash
echo " Running pre-deployment checks..."

# Build verification
echo " Verifying build..."
pnpm build

if [ $? -ne 0 ]; then
  echo " Build failed"
  exit 1
fi

# Test suite
echo " Running test suite..."
pnpm test

if [ $? -ne 0 ]; then
  echo " Tests failed"
  exit 1
fi

# Security audit
echo " Running security audit..."
pnpm audit --audit-level high

if [ $? -ne 0 ]; then
  echo " Security vulnerabilities found"
  # Continue despite vulnerabilities (comment out exit to block deployment)
  # exit 1
fi

echo " Project ready for deployment!"

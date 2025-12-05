#!/bin/bash
echo " Validating database schema..."

# Check if schema has changes
if git diff --name-only HEAD | grep -q "prisma/schema.prisma"; then
  echo " Database schema changes detected"
  
  # Generate client to check for errors
  pnpm db:generate
  
  if [ $? -ne 0 ]; then
    echo " Schema validation failed"
    exit 1
  fi
  
  # Run tests that depend on database
  pnpm test -- db
  
  echo " Schema changes validated successfully"
else
  echo " No schema changes detected"
fi

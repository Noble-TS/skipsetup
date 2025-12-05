#!/bin/bash
echo " Running post-generation setup..."

# Generate Prisma client
echo " Generating Prisma client..."
pnpm db:generate

# Create initial database
echo " Creating initial database..."
pnpm db:push

# Seed database if needed
if [ -f "prisma/seed.ts" ]; then
  echo " Seeding database..."
  pnpm db:seed
fi

# Build project
echo " Building project..."
pnpm build

echo " Post-generation setup complete!"

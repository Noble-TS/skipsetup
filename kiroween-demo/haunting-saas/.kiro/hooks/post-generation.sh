#!/bin/bash
echo "🚀 Running post-generation setup..."

# Generate Prisma client
echo "  Generating Prisma client..."
pnpm db:generate

# Create initial database (or run pending migrations)
echo "  Creating/Updating initial database..."
pnpm db:push # Use 'migrate dev' if you prefer migrations

# Seed database if needed (uncomment if you have a seed file)
# if [ -f "prisma/seed.ts" ]; then
#   echo "  Seeding database..."
#   pnpm db:seed
# fi

# Build project
echo "  Building project..."
pnpm build

echo "✅ Post-generation setup complete!"

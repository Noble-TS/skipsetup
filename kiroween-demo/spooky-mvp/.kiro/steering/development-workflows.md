# SkipSetup Development Workflows

##  STANDARD DEVELOPMENT WORKFLOWS

### 1. Adding New Features

#### Feature Development Process
```
1. Analyze Requirements → 2. Database Schema → 3. API Routes → 4. UI Components → 5. Testing
```

#### Step-by-Step: Adding User Profiles
```bash
# 1. Extend Database Schema (if needed)
# Add to prisma/schema.prisma
model UserProfile {
  id        String   @id @default(cuid())
  bio       String?
  avatar    String?
  website   String?
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("user_profile")
}

# Run migration
pnpm db:push

# 2. Create tRPC Router
# src/server/api/routers/profile.ts
export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.userProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),
  
  update: protectedProcedure
    .input(z.object({ bio: z.string().optional(), avatar: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userProfile.upsert({
        where: { userId: ctx.session.user.id },
        create: { ...input, userId: ctx.session.user.id },
        update: input,
      });
    }),
});

# 3. Add to Root Router
# src/server/api/root.ts
export const appRouter = createTRPCRouter({
  post: postRouter,
  profile: profileRouter, // ← Add this line
});

# 4. Create UI Component
# src/app/_components/profile/EditProfileForm.tsx
"use client";
import { api } from "~/trpc/react";
import { Button } from "../ui/button/Button";
import { Input } from "../form/input/InputField";

export function EditProfileForm() {
  const { data: profile } = api.profile.get.useQuery();
  const updateProfile = api.profile.update.useMutation();
  
  // Use existing form patterns from auth components
}

# 5. Add Page Route
# src/app/profile/page.tsx
import { EditProfileForm } from "~/app/_components/profile/EditProfileForm";

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      <EditProfileForm />
    </div>
  );
}
```

### 2. Modifying Existing Components

#### Component Modification Rules
```typescript
// DO: Extend existing components with new props
interface ButtonProps {
  variant: "primary" | "outline" | "ghost" | "t3-purple" | "glass";
  // Add new variants if needed
  size?: "sm" | "md" | "lg" | "xl"; // Extending sizes
}

//  DO: Use composition over modification
function NewFeatureComponent() {
  return (
    <div className="new-feature">
      <Button variant="t3-purple">Existing component</Button>
      {/* New functionality */}
    </div>
  );
}

//  DON'T: Modify core component logic without discussion
// Avoid changing established patterns in _components/ui/
```

#### Authentication Component Updates
```typescript
// When adding new auth features:
// 1. Extend Better Auth config (if possible via plugins)
// 2. Create new components in _components/auth/
// 3. Follow existing patterns from SignInForm.tsx

// Example: Adding social login
export function SocialSignIn() {
  // Use same styling patterns as SignInForm
  return (
    <div className="space-y-3">
      <button className="w-full flex items-center...">
        {/* Same structure as existing buttons */}
      </button>
    </div>
  );
}
```

### 3. Database Schema Changes

#### Safe Schema Evolution
```bash
# 1. Always use Prisma migrations for changes
pnpm prisma migrate dev --name add_user_profile

# 2. Never modify existing fields without migration
#  DON'T: Change field type directly
#  DO: Create new field and migrate data

# 3. For breaking changes, use multi-step migrations
# Step 1: Add new field (nullable)
# Step 2: Backfill data
# Step 3: Make field required
# Step 4: Remove old field
```

#### Schema Change Examples
```prisma
//  Safe: Adding new optional field
model User {
  // ... existing fields
  phoneNumber String?  // Optional field is safe
}

//  Careful: Adding required field
model User {
  // ... existing fields
  phoneNumber String?  // First add as optional
  // Later migrate to required after data population
}

//  Dangerous: Changing field type
// Instead, create new field and migrate
model User {
  // oldField String  // Don't change type directly
  newField NewType   // Create new field
}
```

### 4. API Development Workflow

#### Adding New tRPC Procedures
```typescript
// Standard procedure template
export const featureRouter = createTRPCRouter({
  // Query for reading data
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feature.findUnique({
        where: { id: input.id },
      });
    }),

  // Mutation for writing data
  create: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1),
      data: z.any().optional() 
    }))
    .mutation(async ({ ctx, input }) => {
      // Always validate inputs with Zod
      // Use ctx.session.user for user context
      return ctx.db.feature.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });
    }),

  // Complex operations with transactions
  complexOperation: protectedProcedure
    .input(z.object({ ... }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        // Multiple operations in transaction
        const result1 = await tx.table1.create({ ... });
        const result2 = await tx.table2.create({ ... });
        return { result1, result2 };
      });
    }),
});
```

### 5. UI Component Development

#### Component Creation Checklist
- [ ] Use existing design system (T3 purple, glassmorphism)
- [ ] Support dark/light mode
- [ ] Include proper TypeScript types
- [ ] Add Storybook stories (if applicable)
- [ ] Test responsive behavior
- [ ] Follow accessibility standards

#### Styling Guidelines
```typescript
// Use established design tokens
const styles = {
  // Colors
  primary: "bg-[hsl(280,100%,70%)]",
  glass: "bg-white/10 backdrop-blur-md border border-white/10",
  
  // Spacing (Tailwind)
  padding: "p-4 md:p-6",
  margin: "m-4",
  
  // Typography
  heading: "text-2xl font-bold text-white",
  body: "text-gray-300",
};

// Responsive design
<div className="flex flex-col md:flex-row gap-4">
  {/* Mobile first, then desktop */}
</div>
```

### 6. Testing Workflows

#### Development Testing
```bash
# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Formatting
pnpm format:write

# All checks
pnpm run checks
```

#### Manual Testing Checklist
- [ ] Authentication flows work (sign in/up, password reset)
- [ ] Database operations succeed
- [ ] UI renders correctly on different screen sizes
- [ ] Error states are handled gracefully
- [ ] Loading states are shown during operations

### 7. Debugging Workflows

#### Common Issues and Solutions

**Authentication Issues:**
```typescript
// Check session
const { data: session } = authClient.useSession();
console.log('Session:', session);

// Verify environment variables
console.log('Auth URL:', process.env.NEXT_PUBLIC_APP_URL);
```

**Database Issues:**
```typescript
// Enable Prisma logging
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Check connection
await prisma.$queryRaw`SELECT 1`;
```

**tRPC Issues:**
```typescript
// Check procedure input
console.log('Input to procedure:', input);

// Check context
console.log('User in context:', ctx.session?.user);
```

### 8. Performance Optimization

#### Client-Side Performance
```typescript
// Use React Query efficiently
const { data, isLoading } = api.post.getLatest.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Optimize re-renders
const mutation = api.post.create.useMutation({
  onSuccess: () => {
    utils.post.invalidate(); // Smart cache invalidation
  },
});
```

#### Server-Side Performance
```typescript
// Database query optimization
const posts = await ctx.db.post.findMany({
  where: { createdById: ctx.session.user.id },
  include: { createdBy: { select: { name: true } } }, // Only needed fields
  take: 10, // Pagination
});
```

##  QUICK REFERENCE COMMANDS

```bash
# Development
pnpm dev          # Start development server
pnpm db:push      # Push database schema changes
pnpm db:studio    # Open Prisma Studio

# Quality
pnpm lint         # Run ESLint
pnpm format:write # Format code with Prettier
pnpm tsc --noEmit # Type check without emitting

# Production
pnpm build        # Build for production
pnpm start        # Start production server
```

This workflow ensures consistent, high-quality development while maintaining the reliability of the SkipSetup foundation.

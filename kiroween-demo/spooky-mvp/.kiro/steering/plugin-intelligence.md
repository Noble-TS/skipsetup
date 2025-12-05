# Plugin Activation Intelligence

## FULLSTACK PLUGIN ACTIVATION

### Activation Hook Execution
The project was initialized using the Fullstack plugin activation hook which:

1. **Created Complete Project Structure** - 7 files generated
2. **Configured Authentication** - Better Auth with Prisma adapter
3. **Set Up Database** - PostgreSQL with proper schema
4. **Integrated Email System** - Resend with React Email templates
5. **Added UI Components** - Complete component library

### Generated Authentication System

#### Better Auth Configuration
```typescript
// src/server/better-auth/config.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma),
  emailAndPassword: { enabled: true },
  plugins: [emailOTP(), nextCookies()],
  user: {
    additionalFields: {
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      stripeCustomerId: { type: "string", required: false }
    }
  }
});
```

#### Available Auth Components
- `SignInForm` - Email/password and OTP login
- `SignUpForm` - User registration with validation
- `UserDropdownProfile` - User menu with session
- `ForgotPassword` - Password reset flow
- `ResetPassword` - Password update functionality

### Database Schema Intelligence

#### Core Models
```prisma
model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  // ... additional fields
  sessions      Session[]
  accounts      Account[]
  posts         Post[]
}

model Post {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  createdBy   User   @relation(fields: [createdById], references: [id])
  createdById String
}
```

### tRPC API Structure

#### Router Pattern
```typescript
// src/server/api/routers/post.ts
export const postRouter = createTRPCRouter({
  hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
    return { greeting: `Hello ${input.text}` };
  }),
  create: protectedProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    return ctx.db.post.create({
      data: {
        name: input.name,
        createdBy: { connect: { id: ctx.session.user.id } },
      },
    });
  }),
});
```

## UI/UX DESIGN SYSTEM

### Component Architecture
- **Button Component**: Multiple variants (primary, outline, ghost, t3-purple, glass)
- **Form Components**: Input, Checkbox, Label with consistent styling
- **Auth Components**: Complete authentication flow components
- **Email Templates**: Aqua/mint themed responsive emails

### Design Constraints
- Use T3 purple color scheme: `hsl(280, 100%, 70%)` for accents
- Glassmorphism effects with backdrop blur
- Dark mode first design approach
- Consistent spacing and typography

## DEVELOPMENT WORKFLOWS

### Adding New Features
1. **Database**: Add to Prisma schema and run `pnpm db:push`
2. **API**: Create new tRPC router following post.ts pattern
3. **UI**: Use existing components from _components directory
4. **Authentication**: Use authClient for client-side auth operations

### File Modification Rules
- CAN MODIFY: Components, routers, pages, styles
- CAN EXTEND: Auth configuration (via plugins), env variables
- CANNOT MODIFY: Core auth config, database client, Prisma schema directly

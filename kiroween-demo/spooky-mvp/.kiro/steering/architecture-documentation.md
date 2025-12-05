# SkipSetup Architecture Documentation

##  SYSTEM ARCHITECTURE

### High-Level Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer      │    │   Backend       │
│   (Next.js)     │◄──►│   (tRPC)         │◄──►│   (Server)      │
│                 │    │                  │    │                 │
│ • App Router    │    │ • Type-safe      │    │ • Better Auth   │
│ • React 19      │    │ • WebSockets     │    │ • Prisma ORM    │
│ • Tailwind CSS  │    │ • React Query    │    │ • PostgreSQL    │
│ • Components    │    │ • Error Handling │    │ • Email         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  │
                      ┌───────────┴───────────┐
                      │   Data & State        │
                      │                       │
                      │ • Database (Prisma)   │
                      │ • Cache (Redis)       │
                      │ • File Storage (S3)   │
                      └───────────────────────┘
```

##  TECHNOLOGY STACK DEEP DIVE

### Frontend Architecture
```typescript
// Next.js 15 App Router Structure
src/app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Home page
├── (auth)/                 # Authentication route group
│   ├── layout.tsx          # Auth-specific layout
│   ├── signin/page.tsx     # Sign in page
│   └── signup/page.tsx     # Sign up page
├── _components/            # Reusable components
│   ├── auth/               # Authentication components
│   ├── form/               # Form components
│   ├── ui/                 # Base UI components
│   └── email/              # Email templates
└── api/                    # API routes
    ├── auth/[...all]/route.ts  # Better Auth endpoints
    ├── trpc/[trpc]/route.ts    # tRPC endpoints
    └── email/route.ts          # Email API
```

### Backend Architecture
```typescript
// Server-Side Structure
src/server/
├── api/
│   ├── root.ts             # Main tRPC router
│   ├── trpc.ts             # tRPC configuration
│   └── routers/            # Feature routers
│       └── post.ts         # Example router
├── better-auth/
│   ├── config.ts           # Auth configuration
│   ├── server.ts           # Server-side auth utils
│   ├── client.ts           # Client-side auth client
│   └── index.ts            # Exports
└── db.ts                   # Database client
```

##  DATA FLOW & COMMUNICATION

### Authentication Flow
1. **Client Initiation**: User interacts with SignInForm/SignUpForm
2. **Auth Client**: `authClient.signIn.email()` or `authClient.signUp.email()`
3. **Server Validation**: Better Auth validates credentials
4. **Session Creation**: Server creates session and returns tokens
5. **Client Storage**: Cookies stored automatically via nextCookies plugin
6. **API Access**: Subsequent requests include session tokens

### API Request Flow
1. **Component**: Calls tRPC procedure via `api.post.create.useMutation()`
2. **tRPC Client**: Sends request to `/api/trpc/[trpc]` endpoint
3. **tRPC Server**: Routes to appropriate procedure in router
4. **Context Creation**: `createTRPCContext` adds db, session to context
5. **Procedure Execution**: Business logic with database operations
6. **Response**: Type-safe data returned to client

### Database Interaction Flow
1. **Procedure**: Calls `ctx.db.post.create()` or other Prisma methods
2. **Prisma Client**: Connection pooling and query optimization
3. **Database**: PostgreSQL executes queries
4. **Response**: Structured data with proper TypeScript types

##  FILE PURPOSE MAPPING

### Critical Configuration Files
| File | Purpose | Can Modify? |
|------|---------|-------------|
| `src/env.js` | Environment validation with Zod |  No |
| `prisma/schema.prisma` | Database schema definition |  Via migrations only |
| `src/server/db.ts` | Prisma client singleton |  No |
| `src/server/better-auth/config.ts` | Auth configuration | No |
| `src/server/api/trpc.ts` | tRPC context and procedures |  Yes (extend) |
| `src/trpc/react.tsx` | React Query + tRPC client | Yes |

### Component Architecture
| Component Category | Location | Purpose |
|-------------------|----------|---------|
| Authentication | `src/app/_components/auth/` | Sign in/up, password reset |
| Form Elements | `src/app/_components/form/` | Input, Checkbox, Label |
| UI Components | `src/app/_components/ui/` | Button, layouts, etc. |
| Email Templates | `src/app/_components/email/` | React Email components |

## SECURITY ARCHITECTURE

### Authentication & Authorization
```typescript
// tRPC Procedure Security
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
```

### Data Validation
```typescript
// Zod Validation in tRPC
const createPostSchema = z.object({
  name: z.string().min(1).max(255),
});

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      // Input is automatically validated
    }),
});
```

### Environment Security
```typescript
// Environment Validation
export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
  },
  // Client-side env vars are explicitly defined
  client: {
    // NEXT_PUBLIC_APP_URL: z.string().url(),
  },
});
```

##  PERFORMANCE CONSIDERATIONS

### Client-Side Optimization
- **React Query**: Automatic caching and background updates
- **Code Splitting**: Next.js automatic code splitting by route
- **Image Optimization**: Next.js Image component with optimization

### Server-Side Optimization
- **Prisma**: Connection pooling and query optimization
- **tRPC**: Batch requests and type-safe caching
- **Middleware**: Efficient request processing

### Database Optimization
- **Indexes**: Proper indexing on foreign keys and search fields
- **Relations**: Efficient relation queries with Prisma
- **Migrations**: Zero-downtime schema updates

##  DEPLOYMENT ARCHITECTURE

### Development Environment
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    ports:
      - "5432:5432"
```

### Production Considerations
- **Environment Variables**: All secrets via environment
- **Database**: Production PostgreSQL with backups
- **File Storage**: S3-compatible storage for uploads
- **CDN**: Static asset delivery via Vercel/CDN

This architecture ensures type safety, performance, and maintainability across the entire stack.

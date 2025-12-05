# Authentication Specifications

## Better Auth Configuration

### Core Features
- Email/password authentication
- OTP (One-Time Password) verification (via email)
- Session management (cookies)
- User impersonation (via admin plugin - if configured)
- Account ban/unban functionality (via plugin - if configured)
- Extensible via plugins

### Session Structure (Conceptual)
```typescript
// Returned by auth.api.getSession()
interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    // ... other user fields defined in schema or additionalFields
    // Potentially includes roles if added via plugins or custom logic
  };
  expiresAt: Date;
  token: string; // Usually handled by the library internally
}
```

### Authentication Middleware (tRPC)
```typescript
// Example protected procedure middleware (from src/server/api/trpc.ts)
const t = initTRPC.context<typeof createTRPCContext>().create({/* ... */});

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ // auth imported from config
    headers: opts.headers,
  });
  return {
    db,
    session, // Attach session to context
    ...opts,
  };
};

const protectedProcedure = t.middleware(async (opts) => {
  const session = opts.ctx.session; // Get session from context

  if (!session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({
    ctx: {
      session, // Pass session down to the procedure
      db: opts.ctx.db, // Pass through other context values like db
    },
  });
});
```

### Security Requirements
- All sensitive API endpoints must use `protectedProcedure` or equivalent auth check (e.g., in Next.js API routes).
- Session cookies must be secure (HttpOnly, Secure flags set by Better Auth).
- Validate session integrity server-side for critical operations.
- Log authentication-related events for security monitoring.
- Protect against common attacks (e.g., CSRF - handled by Better Auth).

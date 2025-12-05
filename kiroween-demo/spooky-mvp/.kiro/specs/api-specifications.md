# API Specifications - spooky-mvp

## Project Information
- **Size**: small
- **Modules**: auth, db, email-resend
- **Generated**: 2025-12-04T09:30:34.447Z

## tRPC API Endpoints

### Authentication Routes
```typescript
// src/server/api/routers/auth.ts
export const authRouter = createTRPCRouter({
  // Public endpoints
  signUp: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      // Better Auth signup logic
    }),
    
  signIn: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Better Auth signin logic
    }),
    
  // Protected endpoints  
  getSession: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.session;
    }),
    
  updateProfile: protectedProcedure
    .input(z.object({ firstName: z.string().optional(), lastName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Update user profile
    })
});
```

### Post Routes (Example)
```typescript
// src/server/api/routers/post.ts
export const postRouter = createTRPCRouter({
  // Public queries
  getLatest: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.post.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true, email: true } } }
    });
  }),
  
  // Protected mutations
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } }
        }
      });
    }),
    
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.delete({
        where: { id: input.id, createdById: ctx.session.user.id }
      });
    })
});
```

## API Response Standards

### Success Response
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Standard Error Codes
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions  
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `INTERNAL_SERVER_ERROR` - Server error

## API Versioning

### Current Version: v1
- Base path: `/api/trpc`
- No breaking changes allowed
- Add new fields as optional
- Maintain backward compatibility

### Response Caching
```typescript
// React Query caching example
const { data } = api.post.getLatest.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

## Security Specifications

### Authentication Requirements
| Endpoint Type | Authentication | Procedure Type |
|---------------|----------------|----------------|
| Public data | Optional | `publicProcedure` |
| User actions | Required | `protectedProcedure` |
| Admin actions | Required + Roles | `adminProcedure` |

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user
- Exponential backoff on failures

### Input Validation
- All inputs validated with Zod
- Sanitize HTML content
- Validate file uploads
- Check payload size limits

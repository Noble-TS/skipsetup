# API Specifications

## tRPC API Endpoints (Internal)

### Post Routes (Example from reference)
```typescript
// src/server/api/routers/post.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  // Public endpoint
  getLatest: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.post.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  }),

  // Protected endpoint requiring authentication
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: ctx.session.user.id, // Link to authenticated user
        },
      });
    }),
});
```

### Authentication Routes (Handled by Better Auth)
- **Sign Up**: `POST /api/auth/sign-up` (via authClient)
- **Sign In**: `POST /api/auth/sign-in` (via authClient)
- **Sign Out**: `POST /api/auth/sign-out` (via authClient)
- **Get Session**: `getSession()` server-side, `useSession()` client-side.

### API Security Requirements (tRPC)
- All tRPC endpoints must be defined as procedures (publicProcedure, protectedProcedure).
- Input validation is mandatory using Zod schemas.
- Authentication is enforced by protectedProcedure via getSession().
- Authorization (RBAC) should be checked within procedures if needed using custom middleware/logic.
- Errors must be handled using TRPCError.
- Logging for debugging and monitoring should be considered.

## Next.js API Routes (External/Integration)

### Checkout Session Creation
- **Endpoint**: `POST /api/checkout/session`
- **Purpose**: Creates a Stripe Checkout Session and a temporary PENDING order in the database.
- **Authentication**: Requires user session (Better Auth).
- **Request Body**: `{ items: [{ id, stripePriceId, quantity, price }], shippingAddress: {...} }`
- **Response**: `{ url: string }` (Stripe checkout URL) or error object.
- **Flow**:
  1. Validate session.
  2. Create PENDING order in DB.
  3. Prepare line items for Stripe.
  4. Create Stripe Checkout Session.
  5. Update DB order with Stripe session ID.
  6. Return checkout URL.

### Stripe Webhook Handler
- **Endpoint**: `POST /api/webhook`
- **Purpose**: Handles Stripe events (e.g., `checkout.session.completed`).
- **Authentication**: Secured via webhook signature verification.
- **Request Body**: Raw Stripe event payload.
- **Response**: `{ received: true }` or error.
- **Flow**:
  1. Verify webhook signature.
  2. Find linked order by session ID.
  3. Confirm payment status.
  4. Update order status to PAID in DB.
  5. Send order confirmation email via Resend.
  6. Respond to Stripe.

### Admin Metrics API
- **Endpoint**: `GET /api/admin/metrics`
- **Purpose**: Fetches aggregated metrics (users, orders, revenue, transactions) for the dashboard.
- **Authentication**: Requires user session and admin role (checked via RBAC).
- **Response**: JSON object containing metric data and growth percentages.
- **Flow**:
  1. Validate session and check RBAC permissions.
  2. Query database (and potentially Stripe API) for metrics.
  3. Calculate growth percentages.
  4. Return aggregated data.

### API Security Requirements (Next.js API Routes)
- Validate user sessions explicitly using Better Auth helpers.
- Implement RBAC checks where necessary using the custom system.
- Verify webhook signatures for external integrations (e.g., Stripe).
- Validate request body data (e.g., using Zod if needed within the route).
- Log security-relevant events.

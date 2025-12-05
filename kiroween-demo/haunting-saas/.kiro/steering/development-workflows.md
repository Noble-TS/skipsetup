# Development Workflows - Fullstack Application

## STANDARD WORKFLOWS

### 1. Adding New Features (General)
```
1.  Plan feature in .kiro/steering/project-blueprint.md (constraints, resources needed).
2.  Identify if database changes are needed (Prisma schema).
3.  If database change needed: Update schema.prisma, run migration.
4.  Implement API logic (tRPC procedure or Next.js API route).
5.  Create/update UI components (in _components directory).
6.  Add authentication/authorization checks (Better Auth, RBAC).
7.  Test integration (frontend, API, database, payment/email if applicable).
8.  Update documentation if necessary.
```

### 2. Database Changes (Prisma)
```bash
# 1. Modify prisma/schema.prisma
# 2. Create and apply migration
pnpm db:migrate dev --name "add_new_feature_field" # Use 'migrate' for safer changes
# OR for development only
# pnpm db:push # Pushes schema changes directly (less safe)

# 3. Update Prisma Client
pnpm db:generate

# 4. Push to database (if needed for testing - usually handled by migrate/push)
# pnpm db:push
```

## PAYMENT INTEGRATION WORKFLOWS

### Checkout Session Creation (Next.js API Route)
```typescript
// File: src/app/api/checkout/session/route.ts (Based on provided code)
import { type NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const { items, shippingAddress } = await request.json();

    // 1. Create a temporary order in the database (PENDING)
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        totalAmount: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        stripeSessionId: null,
        shippingAddress: JSON.stringify(shippingAddress),
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // 2. Prepare line items for Stripe
    const lineItems = items.map((item: any) => ({
      price: item.stripePriceId,
      quantity: item.quantity,
    }));

    // 3. Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: session.user.stripeCustomerId || undefined,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.BETTER_AUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/checkout/cancel`,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
      },
      shipping_address_collection: { allowed_countries: ['ET', 'US', 'CA', 'GB'] },
    });

    // 4. Update the order with the Stripe session ID
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
```

## DEBUGGING WORKFLOWS

### Common Issues
- **Auth Issues**: Check Better Auth session cookies, server/client URL config (`BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`).
- **Database Issues**: Verify Prisma schema matches database, check migration status.
- **API Issues (tRPC)**: Check tRPC procedure inputs/outputs, Zod validation errors, network tab.
- **Payment Issues**: Check Stripe API keys, webhook signatures, database order status updates.
- **UI Issues**: Inspect elements, check console for errors, verify Tailwind class names.
- **Build Issues**: Check TypeScript errors, dependency conflicts.

### Development Commands
```bash
# Development Server
pnpm dev              # Start Next.js dev server

# Database (Prisma)
pnpm db:generate      # Generate Prisma client after schema changes
pnpm db:push          # Push schema changes to database (dev only, less safe)
pnpm db:migrate dev --name "desc" # Create and apply a migration (recommended)
pnpm db:studio        # Open Prisma Studio GUI for database inspection

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler check
pnpm test             # Run tests (if configured)

# Build & Production
pnpm build            # Build the application for production
pnpm start            # Start the production server (after build)

# Stripe CLI (for testing webhooks locally)
stripe listen --forward-to localhost:3000/api/webhook
```

## DEPLOYMENT WORKFLOW

### Environment Setup (Example for Vercel)
1.  **Repository**: Link your Git repository to Vercel.
2.  **Build Command**: `pnpm build`
3.  **Output Directory**: (Usually handled by Next.js)
4.  **Environment Variables**: Add all required variables (DATABASE_URL, BETTER_AUTH_SECRET, STRIPE keys, etc.).
5.  **Post-build**: Ensure database migrations are run as part of deployment (often via Vercel's deployment hooks or a separate CI/CD pipeline).

### Environment Variables (Production)
```env
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
BETTER_AUTH_SECRET=super-long-secret-string-for-production
BETTER_AUTH_URL=https://your-prod-domain.com
NEXT_PUBLIC_APP_URL=https://your-prod-domain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://your-prod-domain.com/checkout/success
STRIPE_CANCEL_URL=https://your-prod-domain.com/checkout/cancel
RESEND_API_KEY=re_...
# Add other secrets if applicable
```

## FILL IN FOR YOUR PROJECT:
- [ ] Define your specific feature development workflow (e.g., involving design reviews).
- [ ] Document your exact deployment process (platform, commands, CI/CD).
- [ ] Add your testing procedures (unit, integration, E2E).
- [ ] Specify your monitoring and logging setup (e.g., Sentry, LogRocket).

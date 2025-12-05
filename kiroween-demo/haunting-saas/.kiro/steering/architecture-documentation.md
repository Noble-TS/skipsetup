# Architecture Documentation - Fullstack Application

## SYSTEM ARCHITECTURE

### High-Level Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js       │    │   tRPC API       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend        │◄──►│   Database      │
│                 │    │   (tRPC)         │    │                 │
│ • React 19      │    │ • Zod Validation │    │ • Prisma ORM    │
│ • TypeScript    │    │ • Better Auth    │    │ • User/Post     │
│ • Tailwind CSS  │    │ • Custom RBAC    │    │ • Product/Order │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Better Auth   │    │   Stripe/       │    │   Resend        │
│   Sessions      │    │   External APIs  │    │   Email         │
│                 │    │                  │    │                 │
│ • Email/OTP     │    │ • Payment APIs   │    │ • Templates     │
│ • RBAC System   │    │ • Webhooks       │    │ • Notifications │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## TECHNOLOGY STACK

### Frontend Architecture
```
src/app/
├── _components/           # Shared components
│   ├── auth/             # Authentication UI (SignInForm, SignUpForm, OTP)
│   ├── common/           # Reusable UI elements (Navbar, Footer, etc.)
│   ├── context/          # React contexts (CartContext, SidebarContext, ThemeContext)
│   ├── dashboard/        # Admin dashboard components (Metrics, Orders, Products)
│   ├── form/             # Form components (InputField, Button, Checkbox)
│   ├── layout/           # Layout components (AdminLayoutClient)
│   ├── tables/           # Table components (DataTable, etc.)
│   └── ui/               # Base UI components (Button, Card, Input, Label)
├── api/                  # Next.js API routes (e.g., Stripe webhook, checkout session)
├── (auth)/               # Authentication route group
├── cart/                 # Shopping cart page
├── checkout/             # Checkout flow pages (session creation, success, cancel)
├── dashboard/            # Admin dashboard pages
├── orders/               # Order history page
└── layout.tsx            # Root layout (includes ThemeProvider, HydrateClient)
```

### Backend Architecture
```
src/server/
├── api/                  # tRPC routers
│   ├── root.ts          # Root tRPC router combining all sub-routers
│   ├── trpc.ts          # tRPC context and base procedure setup
│   └── routers/         # Individual tRPC routers (e.g., post.ts - example)
├── better-auth/         # Authentication
│   ├── config.ts        # Better Auth main configuration (Prisma adapter, plugins)
│   ├── server.ts        # Server-side helpers (getSession)
│   └── client.ts        # Client-side helpers (authClient)
├── stripe/              # Payment processing
│   ├── stripe.ts        # Stripe client instance and session helpers
│   └── sync.ts          # Stripe data synchronization (e.g., customer cache)
└── db.ts                # Prisma database client instance
```

## DATA FLOW

### User Authentication Flow
1.  **Initiation**: User visits sign-in page.
2.  **Request**: Client sends credentials to Better Auth endpoint via authClient.
3.  **Processing**: Better Auth validates credentials, creates session, stores in DB.
4.  **Response**: Session cookie sent to client.
5.  **Validation (Server)**: getSession() verifies cookie, returns session data.
6.  **Validation (Client)**: authClient provides session state.

### API Request Flow (tRPC)
1.  **Initiation (Client)**: Component calls tRPC hook (e.g., api.post.create.useMutation()).
2.  **Transport**: Request sent via httpBatchStreamLink to tRPC server.
3.  **Validation**: Input validated using Zod schema.
4.  **Processing**: Server-side logic executes (e.g., database query via Prisma).
5.  **Response**: Result serialized using SuperJSON, sent back to client.
6.  **Update (Client)**: Component state updates based on response.

### Database Interaction Flow
1.  **Request Context**: tRPC procedure receives Prisma client via context (`ctx.db`).
2.  **Query**: Prisma Client executes database query/mutation.
3.  **Result**: Prisma handles connection pooling, returns data to procedure.
4.  **Response**: tRPC procedure formats and returns data to client.

### Payment Flow (Checkout)
1.  **Initiation (Client)**: User clicks "Checkout" button in cart.
2.  **Request (Client)**: Cart context provides items, client calls Next.js API route (`/api/checkout/session`).
3.  **Processing (API Route)**:
    - Validates user session.
    - Creates a temporary PENDING order in the database.
    - Uses Stripe client to create a Checkout Session, linking to the order ID.
    - Updates the order with the Stripe session ID.
4.  **Response (API Route)**: Returns the Stripe checkout URL.
5.  **Redirect (Client)**: User is redirected to Stripe's hosted checkout page.
6.  **Payment Processing**: User completes payment on Stripe.
7.  **Webhook (Stripe -> API Route)**: Stripe sends a `checkout.session.completed` event to `/api/webhook`.
8.  **Webhook Processing (API Route)**:
    - Verifies webhook signature.
    - Finds the order linked to the session ID.
    - Confirms payment intent status.
    - Updates the order status to PAID.
    - Sends an order confirmation email via Resend.
9.  **Confirmation**: User returns to the success page.

## FILE PURPOSE MAPPING

### Configuration Files
| File | Purpose | Can Modify? |
|------|---------|-------------|
| `prisma/schema.prisma` | Database schema | ⚠️ Carefully (requires migration) |
| `src/server/better-auth/config.ts` | Auth configuration | ⚠️ Carefully (affects auth) |
| `src/server/db.ts` | Database client setup | ⚠️ Carefully (affects DB connection) |
| `tailwind.config.js` | Styling configuration | ✅ Yes |
| `next.config.js` | Next.js configuration | ✅ Yes |

### Core Directories
| Directory | Purpose | Contains |
|-----------|---------|----------|
| `src/app/_components` | UI components | Forms, layouts, charts, base UI |
| `src/server/api` | API logic | tRPC routers, procedures |
| `src/server/better-auth` | Authentication | Config, server/client helpers |
| `src/server/stripe` | Payment processing | Stripe client, webhook handlers, sync logic |
| `src/trpc` | tRPC client setup | Providers, hooks, query client |
| `src/lib` | Utility functions | Access control (RBAC), helpers |
| `prisma` | Database | Schema, migrations, seed |

## FILL IN FOR YOUR PROJECT:
- [ ] Document your custom business logic flows.
- [ ] Add your specific API integrations (e.g., custom payment providers).
- [ ] Detail your custom components.
- [ ] Specify your deployment architecture (e.g., Vercel, Docker).

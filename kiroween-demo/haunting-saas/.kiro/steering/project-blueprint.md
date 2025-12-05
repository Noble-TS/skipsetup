# Project Blueprint - haunting-saas Fullstack Application


## ARCHITECTURE OVERVIEW

### Core Technologies
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: tRPC for type-safe APIs, Better Auth for authentication
- **Database**: Prisma ORM with PostgreSQL
- **Styling**: Tailwind CSS with glassmorphism design system
- **State Management**: TanStack Query (React Query) for server state, React Context for UI state
- **Authentication**: Better Auth (email/password, OTP)
- **Authorization**: Custom RBAC system (`src/lib/access-control.ts`)
- **Payments**: Stripe (Checkout, Webhooks)
- **Email**: Resend (for notifications like order confirmations)

### Project Structure (Key Directories)
```
[project-root]/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication routes (grouped)
│   │   ├── _components/        # Reusable components
│   │   │   ├── auth/          # Authentication forms (SignIn, SignUp, OTP)
│   │   │   ├── common/        # Common UI elements (Navbar, Footer, etc.)
│   │   │   ├── context/       # React contexts (Cart, Sidebar, Theme)
│   │   │   ├── dashboard/     # Admin dashboard components
│   │   │   ├── form/          # Form components (Input, Checkbox, etc.)
│   │   │   ├── header/        # Header components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── tables/        # Table components
│   │   │   └── ui/            # Base UI components (Button, Card, Input)
│   ├── api/               # Next.js API routes (e.g., Stripe webhook, checkout session)
│   ├── cart/              # Shopping cart pages
│   ├── checkout/          # Checkout pages
│   ├── dashboard/         # Admin dashboard pages
│   ├── orders/            # Order history pages
│   └── layout.tsx         # Root layout
│   ├── server/                # Server-side logic
│   │   ├── api/               # tRPC routers
│   │   │   ├── root.ts        # Root tRPC router
│   │   │   └── routers/       # Individual tRPC routers (e.g., post.ts)
│   │   ├── better-auth/       # Better Auth configuration
│   │   │   ├── config.ts      # Auth configuration (handle with care)
│   │   │   ├── server.ts      # Server-side auth helpers (getSession)
│   │   │   └── client.ts      # Client-side auth helpers (authClient)
│   │   ├── stripe/            # Stripe integration
│   │   │   ├── stripe.ts      # Stripe client and session helpers
│   │   │   └── sync.ts        # Stripe data synchronization
│   └── db.ts              # Prisma database client
│   ├── trpc/                  # tRPC client setup
│   │   ├── client.tsx         # tRPC React client provider
│   │   ├── query-client.ts    # TanStack Query client
│   │   └── react.tsx          # tRPC React hooks
│   ├── lib/                   # Utility functions
│   │   └── access-control.ts  # Custom RBAC system
│   └── styles/                # Global styles
│       └── globals.css        # Tailwind imports and base styles
├── prisma/
│   └── schema.prisma          # Database schema definition
└── .kiro/                     # Kiro context directory
```

## DEVELOPMENT CONSTRAINTS

### DO NOT MODIFY (Core Files)
- `prisma/schema.prisma` - Database schema (requires migration if changed)
- `src/server/better-auth/config.ts` - Core auth configuration
- `src/server/db.ts` - Prisma client setup
- `src/server/api/trpc.ts` - tRPC root context setup

### PATTERNS TO FOLLOW
- **Components**: Use TypeScript, follow component specifications, use relative imports (~/)
- **API (tRPC)**: Use publicProcedure/protectedProcedure, validate with Zod, handle errors
- **API (Next.js)**: Use for external integrations (webhooks, checkout session creation)
- **Database (Prisma)**: Use Prisma Client, follow schema patterns, handle transactions
- **Authentication**: Use Better Auth getSession/authClient, follow RBAC checks
- **Styling**: Use Tailwind CSS classes, follow design system (glassmorphism, emerald theme)
- **State (Client)**: Use React State/Context, TanStack Query for server state
- **State (Server)**: Use tRPC context, React Cache

### Environment Variables Required
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=... # e.g., http://localhost:3000
NEXT_PUBLIC_APP_URL=... # e.g., http://localhost:3000
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_SUCCESS_URL=... # e.g., http://localhost:3000/checkout/success
STRIPE_CANCEL_URL=...  # e.g., http://localhost:3000/checkout/cancel
RESEND_API_KEY=...
```

## AVAILABLE UTILITIES

### Core Utilities
```typescript
// Database client
import { db } from "~/server/db";

// Auth session (Server-side)
import { auth } from "~/server/better-auth/config"; // For getSession

// Auth client (Client-side)
import { authClient } from "~/server/better-auth/client";

// tRPC client
import { api } from "~/trpc/react";

// Stripe client
import { stripe } from "~/server/stripe/stripe";

// Access Control (RBAC)
import { ac } from "~/lib/access-control";

// Cart Context
import { useCart } from "~/app/_components/context/CartContext";
```

### UI Components (Example)
```typescript
// Form components
import Input from "~/app/_components/form/input/InputField";
import Button from "~/app/_components/ui/button/Button";
import Checkbox from "~/app/_components/form/input/Checkbox";

// Layout components
import { SidebarProvider, useSidebar } from "~/app/_components/context/SidebarContext";
import { ThemeProvider, useTheme } from "~/app/_components/context/ThemeContext";
```

## SECURITY CONSTRAINTS

### Authentication
- Use Better Auth getSession/authClient for all auth checks.
- Implement role-based access control using the custom RBAC system.
- Validate sessions on protected routes and API endpoints.
- Use protected procedures for sensitive tRPC operations.

### Authorization (RBAC)
- Define roles and permissions in `src/lib/access-control.ts`.
- Check permissions using the `ac` object before sensitive operations.
- Apply RBAC checks in tRPC procedures or Next.js API routes.

### Data Handling
- Validate all inputs with Zod schemas in tRPC procedures.
- Sanitize user inputs before database operations.
- Use parameterized queries (handled by Prisma).
- Implement proper error handling and logging.

### API Security
- Use tRPC for internal type-safe APIs.
- Use Next.js API routes for external integrations (webhooks, checkout).
- Implement rate limiting if necessary.
- Validate API keys and tokens.
- Use HTTPS in production.

## FILL IN FOR YOUR PROJECT:
- [ ] Define your specific business logic and features.
- [ ] Configure your Stripe products/prices.
- [ ] Set up your email templates (e.g., order confirmation).
- [ ] Customize the admin dashboard components.
- [ ] Add your domain-specific models to Prisma schema.

import * as path from 'path';
import fs from 'fs/promises';

// Define proper types for config
interface KiroConfig {
  projectName?: string;
  [key: string]: unknown;
}

export async function generateKiroContext(
  projectDir: string,
  config: KiroConfig
) {
  const kiroDir = path.join(projectDir, '.kiro');

  await Promise.all([
    fs.mkdir(path.join(kiroDir, 'agents'), { recursive: true }),
    fs.mkdir(path.join(kiroDir, 'steering'), { recursive: true }),
    fs.mkdir(path.join(kiroDir, 'specs'), { recursive: true }),
    fs.mkdir(path.join(kiroDir, 'hooks'), { recursive: true }),
    fs.mkdir(path.join(kiroDir, 'mcp'), { recursive: true }),
  ]);

  await Promise.all([
    generateMasterIndex(kiroDir),
    generateProjectBlueprint(kiroDir, config),
    generateArchitecture(kiroDir),
    generateDevelopmentWorkflows(kiroDir),
    generatePluginIntelligence(kiroDir),
    generateAgents(kiroDir),
    generateSpecifications(kiroDir),
    generateHooks(kiroDir),
    generateMcp(kiroDir),
  ]);

  console.log(`Kiro context template generated at ${kiroDir}`);
}

async function generateMasterIndex(kiroDir: string) {
  const content = `# Kiro Context Master Index

## [PROJECT_NAME] Fullstack Documentation

### Core Documentation
1.  **Project Blueprint** (\`project-blueprint.md\`) - Complete project overview and constraints.
2.  **Architecture Documentation** (\`architecture-documentation.md\`) - System architecture and data flows.
3.  **Development Workflows** (\`development-workflows.md\`) - Step-by-step development processes.
4.  **Plugin Intelligence** (\`plugin-intelligence.md\`) - Details on plugin activation and generated capabilities.

### Custom Agents
- **fullstack-specialist** - General development, new features.
- **auth-expert** - Authentication, authorization, user roles.
- **payment-integrator** - Payment flows, checkout, webhooks.
- **database-architect** - Schema, migrations, Prisma operations.
- **ui-specialist** - Component creation, styling, UI patterns.

### System Specifications
- **API Specifications** (\`api-specifications.md\`) - Complete API endpoint documentation.
- **Database Specifications** (\`database-specifications.md\`) - Schema, relationships, constraints.
- **Component Specifications** (\`component-specifications.md\`) - Component standards and patterns.
- **Authentication Specifications** (\`auth-specifications.md\`) - Auth flow, session, permissions.
- **Security Specifications** (\`security-specifications.md\`) - Security requirements and practices.

### Hooks & MCP
- **Pre-commit Hook** (\`hooks/pre-commit.sh\`) - Code quality and validation.
- **Post-generation Hook** (\`hooks/post-generation.sh\`) - Project setup automation.
- **MCP Configuration** (\`mcp/config.json\`) - Model Context Protocol setup.

## QUICK START FOR KIRO AGENTS

### When Developing New Features:
1.  Start with \`project-blueprint.md\` for project-specific constraints.
2.  Consult \`architecture-documentation.md\` for system overview.
3.  Use appropriate agents based on the task (e.g., auth-expert for auth, payment-integrator for payments).
4.  Reference specifications for implementation details.

This context provides 100% understanding of the project for zero-error development.
`;

  await fs.writeFile(path.join(kiroDir, 'steering/MASTER_INDEX.md'), content);
}

async function generateProjectBlueprint(kiroDir: string, config: KiroConfig) {
  const projectName = config.projectName || '[PROJECT_NAME]';

  // const content = `# Project Blueprint - Fullstack Application
  const content = `# Project Blueprint - ${projectName} Fullstack Application


## ARCHITECTURE OVERVIEW

### Core Technologies
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: tRPC for type-safe APIs, Better Auth for authentication
- **Database**: Prisma ORM with PostgreSQL
- **Styling**: Tailwind CSS with glassmorphism design system
- **State Management**: TanStack Query (React Query) for server state, React Context for UI state
- **Authentication**: Better Auth (email/password, OTP)
- **Authorization**: Custom RBAC system (\`src/lib/access-control.ts\`)
- **Payments**: Stripe (Checkout, Webhooks)
- **Email**: Resend (for notifications like order confirmations)

### Project Structure (Key Directories)
\`\`\`
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
\`\`\`

## DEVELOPMENT CONSTRAINTS

### DO NOT MODIFY (Core Files)
- \`prisma/schema.prisma\` - Database schema (requires migration if changed)
- \`src/server/better-auth/config.ts\` - Core auth configuration
- \`src/server/db.ts\` - Prisma client setup
- \`src/server/api/trpc.ts\` - tRPC root context setup

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
\`\`\`env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=... # e.g., http://localhost:3000
NEXT_PUBLIC_APP_URL=... # e.g., http://localhost:3000
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_SUCCESS_URL=... # e.g., http://localhost:3000/checkout/success
STRIPE_CANCEL_URL=...  # e.g., http://localhost:3000/checkout/cancel
RESEND_API_KEY=...
\`\`\`

## AVAILABLE UTILITIES

### Core Utilities
\`\`\`typescript
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
\`\`\`

### UI Components (Example)
\`\`\`typescript
// Form components
import Input from "~/app/_components/form/input/InputField";
import Button from "~/app/_components/ui/button/Button";
import Checkbox from "~/app/_components/form/input/Checkbox";

// Layout components
import { SidebarProvider, useSidebar } from "~/app/_components/context/SidebarContext";
import { ThemeProvider, useTheme } from "~/app/_components/context/ThemeContext";
\`\`\`

## SECURITY CONSTRAINTS

### Authentication
- Use Better Auth getSession/authClient for all auth checks.
- Implement role-based access control using the custom RBAC system.
- Validate sessions on protected routes and API endpoints.
- Use protected procedures for sensitive tRPC operations.

### Authorization (RBAC)
- Define roles and permissions in \`src/lib/access-control.ts\`.
- Check permissions using the \`ac\` object before sensitive operations.
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
`;
  await fs.writeFile(
    path.join(kiroDir, 'steering/project-blueprint.md'),
    content
  );
}

async function generateArchitecture(kiroDir: string) {
  const content = `# Architecture Documentation - Fullstack Application

## SYSTEM ARCHITECTURE

### High-Level Architecture Diagram
\`\`\`
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
\`\`\`

## TECHNOLOGY STACK

### Frontend Architecture
\`\`\`
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
\`\`\`

### Backend Architecture
\`\`\`
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
\`\`\`

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
1.  **Request Context**: tRPC procedure receives Prisma client via context (\`ctx.db\`).
2.  **Query**: Prisma Client executes database query/mutation.
3.  **Result**: Prisma handles connection pooling, returns data to procedure.
4.  **Response**: tRPC procedure formats and returns data to client.

### Payment Flow (Checkout)
1.  **Initiation (Client)**: User clicks "Checkout" button in cart.
2.  **Request (Client)**: Cart context provides items, client calls Next.js API route (\`/api/checkout/session\`).
3.  **Processing (API Route)**:
    - Validates user session.
    - Creates a temporary PENDING order in the database.
    - Uses Stripe client to create a Checkout Session, linking to the order ID.
    - Updates the order with the Stripe session ID.
4.  **Response (API Route)**: Returns the Stripe checkout URL.
5.  **Redirect (Client)**: User is redirected to Stripe's hosted checkout page.
6.  **Payment Processing**: User completes payment on Stripe.
7.  **Webhook (Stripe -> API Route)**: Stripe sends a \`checkout.session.completed\` event to \`/api/webhook\`.
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
| \`prisma/schema.prisma\` | Database schema | ⚠️ Carefully (requires migration) |
| \`src/server/better-auth/config.ts\` | Auth configuration | ⚠️ Carefully (affects auth) |
| \`src/server/db.ts\` | Database client setup | ⚠️ Carefully (affects DB connection) |
| \`tailwind.config.js\` | Styling configuration | ✅ Yes |
| \`next.config.js\` | Next.js configuration | ✅ Yes |

### Core Directories
| Directory | Purpose | Contains |
|-----------|---------|----------|
| \`src/app/_components\` | UI components | Forms, layouts, charts, base UI |
| \`src/server/api\` | API logic | tRPC routers, procedures |
| \`src/server/better-auth\` | Authentication | Config, server/client helpers |
| \`src/server/stripe\` | Payment processing | Stripe client, webhook handlers, sync logic |
| \`src/trpc\` | tRPC client setup | Providers, hooks, query client |
| \`src/lib\` | Utility functions | Access control (RBAC), helpers |
| \`prisma\` | Database | Schema, migrations, seed |

## FILL IN FOR YOUR PROJECT:
- [ ] Document your custom business logic flows.
- [ ] Add your specific API integrations (e.g., custom payment providers).
- [ ] Detail your custom components.
- [ ] Specify your deployment architecture (e.g., Vercel, Docker).
`;
  await fs.writeFile(
    path.join(kiroDir, 'steering/architecture-documentation.md'),
    content
  );
}

async function generateDevelopmentWorkflows(kiroDir: string) {
  // Fix the escape character issue on line that was 1194
  const content = `# Development Workflows - Fullstack Application

## STANDARD WORKFLOWS

### 1. Adding New Features (General)
\`\`\`
1.  Plan feature in .kiro/steering/project-blueprint.md (constraints, resources needed).
2.  Identify if database changes are needed (Prisma schema).
3.  If database change needed: Update schema.prisma, run migration.
4.  Implement API logic (tRPC procedure or Next.js API route).
5.  Create/update UI components (in _components directory).
6.  Add authentication/authorization checks (Better Auth, RBAC).
7.  Test integration (frontend, API, database, payment/email if applicable).
8.  Update documentation if necessary.
\`\`\`

### 2. Database Changes (Prisma)
\`\`\`bash
# 1. Modify prisma/schema.prisma
# 2. Create and apply migration
pnpm db:migrate dev --name "add_new_feature_field" # Use 'migrate' for safer changes
# OR for development only
# pnpm db:push # Pushes schema changes directly (less safe)

# 3. Update Prisma Client
pnpm db:generate

# 4. Push to database (if needed for testing - usually handled by migrate/push)
# pnpm db:push
\`\`\`

## PAYMENT INTEGRATION WORKFLOWS

### Checkout Session Creation (Next.js API Route)
\`\`\`typescript
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
      success_url: \`\${process.env.BETTER_AUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=\${order.id}\`,
      cancel_url: \`\${process.env.BETTER_AUTH_URL}/checkout/cancel\`,
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
\`\`\`

## DEBUGGING WORKFLOWS

### Common Issues
- **Auth Issues**: Check Better Auth session cookies, server/client URL config (\`BETTER_AUTH_URL\`, \`NEXT_PUBLIC_APP_URL\`).
- **Database Issues**: Verify Prisma schema matches database, check migration status.
- **API Issues (tRPC)**: Check tRPC procedure inputs/outputs, Zod validation errors, network tab.
- **Payment Issues**: Check Stripe API keys, webhook signatures, database order status updates.
- **UI Issues**: Inspect elements, check console for errors, verify Tailwind class names.
- **Build Issues**: Check TypeScript errors, dependency conflicts.

### Development Commands
\`\`\`bash
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
\`\`\`

## DEPLOYMENT WORKFLOW

### Environment Setup (Example for Vercel)
1.  **Repository**: Link your Git repository to Vercel.
2.  **Build Command**: \`pnpm build\`
3.  **Output Directory**: (Usually handled by Next.js)
4.  **Environment Variables**: Add all required variables (DATABASE_URL, BETTER_AUTH_SECRET, STRIPE keys, etc.).
5.  **Post-build**: Ensure database migrations are run as part of deployment (often via Vercel's deployment hooks or a separate CI/CD pipeline).

### Environment Variables (Production)
\`\`\`env
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
\`\`\`

## FILL IN FOR YOUR PROJECT:
- [ ] Define your specific feature development workflow (e.g., involving design reviews).
- [ ] Document your exact deployment process (platform, commands, CI/CD).
- [ ] Add your testing procedures (unit, integration, E2E).
- [ ] Specify your monitoring and logging setup (e.g., Sentry, LogRocket).
`;
  await fs.writeFile(
    path.join(kiroDir, 'steering/development-workflows.md'),
    content
  );
}
async function generatePluginIntelligence(kiroDir: string) {
  const content = `# Plugin Activation Intelligence

## PROJECT STRUCTURE & INTEGRATIONS
### Activation Hook Execution
The project was initialized with specific configurations for:
1.  **Authentication**: Better Auth with Prisma adapter, email OTP, admin plugins.
2.  **Database**: PostgreSQL with Prisma schema including standard models and auth models.
3.  **API Layer**: tRPC configured with context including database client and session.
4.  **Frontend**: Next.js App Router, Tailwind CSS, TanStack Query for data fetching.
5.  **UI Components**: Reusable component library with auth, form, layout, and base UI elements.
6.  **Context Management**: React Context for theme, sidebar, cart state.
7.  **Type Safety**: TypeScript throughout, Zod for input validation.
8.  **Payment Integration**: Stripe setup for Checkout Sessions and Webhooks.
9.  **Email Integration**: Resend for sending notifications (e.g., order confirmations).
10. **Authorization**: Custom Role-Based Access Control (RBAC) system.

### Key Integrations
- **Better Auth**: Handles user sessions, passwords, OTP.
- **Prisma**: ORM for database interactions.
- **tRPC**: Type-safe communication between frontend and backend.
- **TanStack Query**: Client-side data fetching and caching.
- **Tailwind CSS**: Styling framework.
- **Zod**: Runtime validation.
- **Stripe**: Payment processing.
- **Resend**: Email delivery.
- **Custom RBAC**: Fine-grained permissions.
`;
  await fs.writeFile(
    path.join(kiroDir, 'steering/plugin-intelligence.md'),
    content
  );
}

// Add proper types for agent configuration
interface AgentConfig {
  name: string;
  description: string;
  tools: string[];
  allowedTools: string[];
  resources: string[];
  prompt: string;
  model: string;
}

async function generateAgents(kiroDir: string) {
  const agents: Record<string, AgentConfig> = {
    'fullstack-specialist': {
      name: 'fullstack-specialist',
      description: "Complete fullstack development with the project's patterns",
      tools: ['read', 'write', 'execute'],
      allowedTools: ['read', 'write'],
      resources: [
        'file://.kiro/steering/project-blueprint.md',
        'file://.kiro/steering/plugin-intelligence.md',
        'file://src/app/_components/**/*.tsx',
        'file://src/server/api/routers/**/*.ts',
        'file://src/server/better-auth/**/*.ts',
        'file://prisma/schema.prisma',
        'file://src/trpc/**/*.ts',
        'file://src/app/api/checkout/**/*.ts',
        'file://src/app/api/webhook/route.ts',
        'file://src/lib/access-control.ts',
      ],
      prompt: `You are a fullstack specialist working on a Next.js project with tRPC, Better Auth, Prisma, Stripe, and Resend.
CRITICAL CONSTRAINTS:
• Use existing authentication patterns (Better Auth getSession/authClient) - never rebuild auth.
• Use existing UI components and styles (Tailwind, _components) - extend, don't replace wholesale.
• Follow tRPC router structure for internal APIs and Next.js API routes for external integrations.
• Use Prisma Client for all database interactions.
• Respect file modification rules: Do not modify core auth config, db client, schema directly without migration.
• Integrate payments using existing Stripe setup (checkout sessions, webhooks).
• Send emails using existing Resend setup.

CRITICAL CONTEXT:
- This project uses Better Auth for sessions and user management.
- tRPC provides type-safe APIs with Zod validation for internal communication.
- Next.js API routes handle external integrations like Stripe webhooks and checkout session creation.
- Prisma ORM handles database operations.
- Tailwind CSS is the styling framework with a glassmorphism/emerald theme.
- TanStack Query manages client-side state for server data.
- Custom RBAC system defines roles and permissions.
- Stripe handles payment processing.
- Resend handles email delivery.

DEVELOPMENT RULES:
- Use relative imports (~/) for project paths.
- Validate tRPC inputs with Zod.
- Use protectedProcedure for authenticated tRPC endpoints.
- Check permissions using custom RBAC (ac.can) for sensitive operations.
- Follow existing component patterns in _components.
- Use CartContext for managing shopping cart state.
- Create checkout sessions via the /api/checkout/session endpoint.
- Process payments via the /api/webhook endpoint.
- Send emails using Resend with templates in _components/email/ (if applicable).
`,
      model: 'gpt-4o',
    },
    'auth-expert': {
      name: 'auth-expert',
      description: 'Authentication and user management specialist',
      tools: ['read', 'write'],
      allowedTools: ['read'],
      resources: [
        'file://.kiro/steering/plugin-intelligence.md',
        'file://src/server/better-auth/config.ts',
        'file://src/app/_components/auth/**/*.tsx',
        'file://src/app/(auth)/**/*.tsx',
        'file://prisma/schema.prisma', // To understand user model
        'file://src/server/better-auth/server.ts',
        'file://src/server/better-auth/client.ts',
      ],
      prompt: `You specialize in authentication and authorization within this project.
CRITICAL CONSTRAINTS:
• Never modify src/server/better-auth/config.ts core configuration without understanding implications.
• Use existing auth components (SignInForm, SignUpForm, OTP flow) - don't rebuild authentication UI unnecessarily.
• Follow Better Auth patterns for session management (getSession, authClient).
• Respect the Prisma adapter setup.
• Integrate with the custom RBAC system for permissions.

DEVELOPMENT RULES:
- Add new auth flows using Better Auth plugins if possible.
- Use auth.api.getSession() for server-side auth checks (import from config).
- Use authClient for client-side operations.
- Extend user model via additionalFields in config if needed.
- Follow existing password reset and OTP patterns.
- Check user permissions using the RBAC system (ac.can) after authentication.
`,
      model: 'gpt-4o',
    },
    'payment-integrator': {
      name: 'payment-integrator',
      description: 'Stripe payment processing and webhook specialist',
      tools: ['read', 'write'],
      allowedTools: ['read'],
      resources: [
        'file://.kiro/steering/project-blueprint.md',
        'file://src/app/api/checkout/session/route.ts',
        'file://src/app/api/webhook/route.ts',
        'file://src/server/stripe/stripe.ts',
        'src/server/db.ts', // For database interactions related to payments
        'file://src/lib/access-control.ts', // For potential admin actions on payments
      ],
      prompt: `You manage Stripe integration, including checkout sessions and webhook handling.
CRITICAL CONSTRAINTS:
• Never expose Stripe secret keys.
• Ensure webhook handlers are idempotent and secure (verify signatures).
• Always update database records (orders) based on webhook events.
• Test payments in Stripe test mode using the Stripe CLI.
• Create temporary PENDING orders before initiating checkout sessions.

DEVELOPMENT RULES:
- Follow secure webhook handling patterns in /api/webhook/route.ts.
- Use Stripe's official Node.js library.
- Store relevant Stripe IDs (customer, price, session) in the database.
- Log payment-related events for debugging.
- Create checkout sessions via /api/checkout/session/route.ts, ensuring session validation and temporary order creation.
- Send order confirmation emails via Resend after successful payment confirmation in the webhook.
`,
      model: 'gpt-4o',
    },
    'database-architect': {
      name: 'database-architect',
      description: 'Database schema and Prisma operations specialist',
      tools: ['read', 'write', 'execute'],
      allowedTools: ['read', 'execute'],
      resources: [
        'file://.kiro/steering/project-blueprint.md',
        'file://prisma/schema.prisma',
        'file://src/server/db.ts',
        'file://src/server/api/routers/**/*.ts',
        'file://src/app/api/**/*.ts', // Next.js API routes might interact with DB
      ],
      prompt: `You manage database schemas and Prisma operations.
CRITICAL CONSTRAINTS:
• Always run database migrations after schema changes (pnpm db:migrate dev).
• Do not modify the Prisma client instantiation in src/server/db.ts.
• Use Prisma Client for all database interactions.
• Respect existing model relationships and constraints.
• Store prices in cents (Int) as per existing schema.

DEVELOPMENT RULES:
- Update prisma/schema.prisma for structural changes.
- Run pnpm db:generate after schema changes.
- Run pnpm db:migrate dev to apply changes (development).
- Use transactions for multi-step database operations (e.g., creating an order with items).
- Follow existing query patterns in tRPC routers and Next.js API routes.
- Consider performance implications of queries and indexes.
- Use JSON fields for complex data like shippingAddress if needed.
`,
      model: 'gpt-4o',
    },
    'ui-specialist': {
      name: 'ui-specialist',
      description: 'UI component development and styling specialist',
      tools: ['read', 'write'],
      allowedTools: ['read'],
      resources: [
        'file://.kiro/steering/project-blueprint.md',
        'file://src/app/_components/**/*.tsx',
        'src/app/globals.css',
        'tailwind.config.js',
        'file://src/app/_components/context/CartContext.tsx', // For cart UI integration
      ],
      prompt: `You specialize in creating and updating UI components using Tailwind CSS.
CRITICAL CONSTRAINTS:
• Follow existing component patterns in src/app/_components/.
• Use Tailwind CSS classes exclusively for styling.
• Maintain responsive design.
• Respect the established design system (e.g., glassmorphism, emerald theme).
• Use relative imports (~/) for project paths.
• Integrate with CartContext for shopping cart functionality where needed.

DEVELOPMENT RULES:
- Create new components in appropriate subdirectories of _components.
- Use TypeScript interfaces for component props.
- Follow accessibility best practices (ARIA attributes).
- Leverage existing base components (Button, Input, Label) when possible.
- Use consistent naming conventions.
- Ensure components work well with the CartContext if related to products/orders.
`,
      model: 'gpt-4o',
    },
  };

  // Write agent configurations
  for (const [agentName, agentConfig] of Object.entries(agents)) {
    await fs.writeFile(
      path.join(kiroDir, `agents/${agentName}.json`),
      JSON.stringify(agentConfig, null, 2)
    );
  }
}

async function generateSpecifications(kiroDir: string) {
  const specs = {
    'api-specifications.md': `# API Specifications

## tRPC API Endpoints (Internal)

### Post Routes (Example from reference)
\`\`\`typescript
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
\`\`\`

### Authentication Routes (Handled by Better Auth)
- **Sign Up**: \`POST /api/auth/sign-up\` (via authClient)
- **Sign In**: \`POST /api/auth/sign-in\` (via authClient)
- **Sign Out**: \`POST /api/auth/sign-out\` (via authClient)
- **Get Session**: \`getSession()\` server-side, \`useSession()\` client-side.

### API Security Requirements (tRPC)
- All tRPC endpoints must be defined as procedures (publicProcedure, protectedProcedure).
- Input validation is mandatory using Zod schemas.
- Authentication is enforced by protectedProcedure via getSession().
- Authorization (RBAC) should be checked within procedures if needed using custom middleware/logic.
- Errors must be handled using TRPCError.
- Logging for debugging and monitoring should be considered.

## Next.js API Routes (External/Integration)

### Checkout Session Creation
- **Endpoint**: \`POST /api/checkout/session\`
- **Purpose**: Creates a Stripe Checkout Session and a temporary PENDING order in the database.
- **Authentication**: Requires user session (Better Auth).
- **Request Body**: \`{ items: [{ id, stripePriceId, quantity, price }], shippingAddress: {...} }\`
- **Response**: \`{ url: string }\` (Stripe checkout URL) or error object.
- **Flow**:
  1. Validate session.
  2. Create PENDING order in DB.
  3. Prepare line items for Stripe.
  4. Create Stripe Checkout Session.
  5. Update DB order with Stripe session ID.
  6. Return checkout URL.

### Stripe Webhook Handler
- **Endpoint**: \`POST /api/webhook\`
- **Purpose**: Handles Stripe events (e.g., \`checkout.session.completed\`).
- **Authentication**: Secured via webhook signature verification.
- **Request Body**: Raw Stripe event payload.
- **Response**: \`{ received: true }\` or error.
- **Flow**:
  1. Verify webhook signature.
  2. Find linked order by session ID.
  3. Confirm payment status.
  4. Update order status to PAID in DB.
  5. Send order confirmation email via Resend.
  6. Respond to Stripe.

### Admin Metrics API
- **Endpoint**: \`GET /api/admin/metrics\`
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
`,

    'database-specifications.md': `# Database Specifications

## Database Schema (Prisma)

### Core Models (Based on provided schema and code)
\`\`\`prisma
// User model (Better Auth adds fields, example with custom fields)
model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  name                String?
  firstName           String?
  lastName            String?
  image               String?  // Profile picture URL
  emailVerified       DateTime?
  stripeCustomerId    String?  // Link to Stripe customer
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  orders              Order[]  // User's orders
  // ... other relations (posts if applicable)
}

// Product model
model Product {
  id              String    @id @default(cuid())
  name            String
  description     String?
  price           Int       // Price in cents (e.g., 2999 for $29.99)
  image           String?   // Product image URL
  stock           Int       // Available stock
  category        String?   // Product category
  active          Boolean   @default(true)
  stripeProductId String?   // Stripe product ID
  stripePriceId   String?   // Stripe price ID
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String    // User ID (foreign key)
  user            User      @relation(fields: [createdBy], references: [id])
  orderItems      OrderItem[] // Junction table items referencing this product

  @@map("products")
}

// Order model
model Order {
  id              String      @id @default(cuid())
  status          OrderStatus @default(PENDING)
  totalAmount     Int         // Total in cents
  userId          String      // User ID (foreign key)
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[] // Junction table items for this order
  stripeSessionId String?     // Link to Stripe checkout session
  shippingAddress String?     // Store as JSON string or separate address model
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

// Junction table for Order Items
model OrderItem {
  id         String   @id @default(cuid())
  quantity   Int      // Quantity ordered
  price      Int      // Price per item at time of order (in cents)
  productId  String   // Product ID (foreign key)
  orderId    String   // Order ID (foreign key)
  product    Product  @relation(fields: [productId], references: [id], onDelete: Restrict) // Restrict delete if items exist
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade) // Delete items if order is deleted

  @@unique([orderId, productId]) // Prevent duplicate products in an order
  @@map("order_items")
}

enum OrderStatus {
  PENDING     // Checkout session created
  PROCESSING  // Payment received, processing
  PAID        // Payment confirmed and processed
  CANCELLED   // Order cancelled
  REFUNDED    // Order refunded
  SHIPPED     // Order shipped
  DELIVERED   // Order delivered
}

// Example Post model (from reference, if used)
model Post {
  id          String   @id @default(cuid())
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String   // User ID (foreign key)
  user        User     @relation(fields: [createdBy], references: [id])

  @@map("posts")
}
\`\`\`

### Database Operations Standards
- Use Prisma Client for all database interactions (findMany, create, update, etc.).
- Implement proper error handling around Prisma calls (try/catch).
- Use transactions (\`await db.$transaction([...])\`) for operations that must succeed or fail together (e.g., creating an order and its items).
- Validate data before passing it to Prisma queries (using Zod or other validators).
- Consider adding database indexes for frequently queried fields (e.g., \`status\` on Order, \`userId\` on Order).
- Follow Prisma's relation syntax for defining and querying related data.
- Store prices in cents (Int type) to avoid floating-point precision issues.
- Store complex objects like \`shippingAddress\` as JSON strings if not requiring relational queries, otherwise create a separate Address model.
`,

    'component-specifications.md': `# Component Specifications

## Design System Components

### Button Component (Example)
\`\`\`typescript
// src/app/_components/ui/button/Button.tsx (Conceptual)
interface ButtonProps {
  variant?: "default" | "primary" | "outline" | "t3-purple" | "glass" | "emerald"; // Follow existing theme
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset'; // Important HTML attribute
}

// Variants (Follow existing theme)
- default: Standard styling
- primary: Prominent action
- outline: Secondary action
- t3-purple: T3 stack theme
- glass: Glassmorphism effect
- emerald: Emerald/green theme (for actions like 'Add to Cart', 'Checkout')

// Sizes
- sm: Small (e.g., height: 32px)
- md: Medium (e.g., height: 40px) - Default
- lg: Large (e.g., height: 48px)
- xl: Extra large (e.g., height: 56px)
\`\`\`

### Input Component (Example)
\`\`\`typescript
// src/app/_components/form/input/InputField.tsx (Conceptual)
interface InputFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  type?: "text" | "email" | "password" | "number";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void; // Or (e: React.ChangeEvent<HTMLInputElement>)
}

// States
- Default: Standard input appearance
- Error: Visual indication (e.g., red border) with error message
- Success: Visual indication (e.g., green border)
- Disabled: Non-interactive, visually distinct
\`\`\`

## Component Development Standards
- All components must be strongly typed using TypeScript interfaces.
- Use Tailwind CSS utility classes for styling - no custom CSS files for components.
- Implement responsive design using Tailwind's responsive prefixes (sm:, md:, lg:, etc.).
- Follow accessibility guidelines (e.g., proper labeling, ARIA attributes where needed).
- Use relative imports from the project root: \`import Component from "~/path/to/component";\`.
- Maintain consistent naming conventions (PascalCase for components, camelCase for props).
- Include default props where appropriate for common configurations.
- Prefer composition (child components, render props) over complex conditional rendering within a single component file.
- Integrate with React Contexts where necessary (e.g., CartContext for product buttons).
`,

    'auth-specifications.md': `# Authentication Specifications

## Better Auth Configuration

### Core Features
- Email/password authentication
- OTP (One-Time Password) verification (via email)
- Session management (cookies)
- User impersonation (via admin plugin - if configured)
- Account ban/unban functionality (via plugin - if configured)
- Extensible via plugins

### Session Structure (Conceptual)
\`\`\`typescript
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
\`\`\`

### Authentication Middleware (tRPC)
\`\`\`typescript
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
\`\`\`

### Security Requirements
- All sensitive API endpoints must use \`protectedProcedure\` or equivalent auth check (e.g., in Next.js API routes).
- Session cookies must be secure (HttpOnly, Secure flags set by Better Auth).
- Validate session integrity server-side for critical operations.
- Log authentication-related events for security monitoring.
- Protect against common attacks (e.g., CSRF - handled by Better Auth).
`,

    'security-specifications.md': `# Security Specifications

## General Security Practices

### Input Validation
- **tRPC Procedures**: Use Zod schemas for all input validation on the server-side.
- **Next.js API Routes**: Validate request body and query parameters explicitly.
- **Client-side**: Validation is helpful for UX but never trusted; server-side validation is mandatory.

### Output Encoding
- **React**: Handles basic XSS prevention for text content. Be cautious with \`dangerouslySetInnerHTML\`.
- **Database**: Prisma handles SQL injection prevention through parameterized queries.

### Authentication & Authorization
- **Authentication**: Handled by Better Auth (session cookies).
- **Authorization**: Use tRPC's \`protectedProcedure\` for auth checks. Implement custom RBAC logic within procedures/routers or Next.js API routes for fine-grained control.

### Secrets Management
- Store API keys, database URLs, auth secrets in environment variables.
- Never commit secrets to version control (.env.example is okay for structure).
- Use different secrets for development and production.

### API Security
- Implement rate limiting for public endpoints if necessary.
- Use HTTPS in production.
- Validate and sanitize data received from external APIs (e.g., Stripe webhooks, Resend responses).
- Log security-relevant events.
- Secure webhook endpoints with signature verification (e.g., Stripe).

### Data Protection
- Encrypt sensitive data at rest if required by compliance (e.g., GDPR).
- Use secure protocols for data transmission (HTTPS).
- Follow data minimization principles (e.g., store only necessary fields from Stripe).

## FILL IN FOR YOUR PROJECT:
- [ ] Define specific RBAC rules if implemented beyond basic roles.
- [ ] Add details about data encryption if used.
- [ ] Specify rate limiting strategies.
- [ ] Detail compliance requirements (e.g., GDPR, CCPA).
`,
  };

  // Write specification files
  for (const [fileName, content] of Object.entries(specs)) {
    await fs.writeFile(path.join(kiroDir, `specs/${fileName}`), content);
  }

  // Create specs README
  const specsReadme = `# System Specifications

## Available Specifications

### API Specifications
- **File**: \`api-specifications.md\`
- **Purpose**: Complete API endpoint documentation (tRPC and Next.js API routes), response standards, and security requirements.

### Database Specifications
- **File**: \`database-specifications.md\`
- **Purpose**: Database schema definition, relationships, constraints, and operation standards.

### Component Specifications
- **File**: \`component-specifications.md\`
- **Purpose**: UI component standards, design patterns, and implementation guidelines.

### Authentication Specifications
- **File**: \`auth-specifications.md\`
- **Purpose**: Authentication flow, session management, and permission system details.

### Security Specifications
- **File**: \`security-specifications.md\`
- **Purpose**: General security practices, data protection, and compliance guidelines.

## Using Specifications
- Refer to these documents when creating new components, API endpoints, or database models.
- Ensure new code adheres to the defined standards and security requirements.
- Update specifications when making significant changes.
- Use specifications to onboard new team members.
`;
  await fs.writeFile(path.join(kiroDir, 'specs/README.md'), specsReadme);
}
// Add proper types for hook configuration
interface HookConfig {
  name: string;
  description: string;
  script: string;
  triggers: string[];
  enabled: boolean;
}

async function generateHooks(kiroDir: string) {
  const hooks: Record<string, HookConfig> = {
    'pre-commit': {
      name: 'pre-commit',
      description: 'Run before committing code to ensure quality',
      script: `#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Type checking
echo "  Type checking..."
pnpm type-check
if [ $? -ne 0 ]; then
  echo "  ❌ TypeScript errors found"
  exit 1
fi

# Linting
echo "  Linting..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "  ❌ ESLint errors found"
  exit 1
fi

# Tests
echo "  Running tests..."
pnpm test --passWithNoTests
if [ $? -ne 0 ]; then
  echo "  ❌ Tests failed"
  exit 1
fi

echo "  ✅ All pre-commit checks passed!"
`,
      triggers: ['commit'],
      enabled: true,
    },
    'post-generation': {
      name: 'post-generation',
      description: 'Run after project generation to set up initial state',
      script: `#!/bin/bash
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
`,
      triggers: ['generate'],
      enabled: true,
    },
  };

  // Write hook configurations
  for (const [hookName, hookConfig] of Object.entries(hooks)) {
    await fs.writeFile(
      path.join(kiroDir, `hooks/${hookName}.json`),
      JSON.stringify(hookConfig, null, 2)
    );
    // Also create executable script files
    await fs.writeFile(
      path.join(kiroDir, `hooks/${hookName}.sh`),
      hookConfig.script
    );
    // Make script executable
    await fs.chmod(path.join(kiroDir, `hooks/${hookName}.sh`), 0o755);
  }

  const hooksReadme = `# Kiro Hooks System

## Available Hooks
Hooks are automated scripts that run at specific points in the development lifecycle.

### Pre-commit Hook
- **Purpose**: Ensure code quality before commits
- **Runs**: Type checking, linting, tests
- **Location**: \`hooks/pre-commit.sh\`

### Post-generation Hook
- **Purpose**: Set up project after generation
- **Runs**: Prisma client generation, database setup, initial build
- **Location**: \`hooks/post-generation.sh\`

## Using Hooks

### Manual Execution
\`\`\`bash
# Run specific hook
./.kiro/hooks/pre-commit.sh
# Run all enabled hooks for a trigger (conceptual)
# find .kiro/hooks -name "*.sh" -exec {} \\;
\`\`\`

### Automatic Execution
Hooks are designed to be triggered automatically by development tools or processes:
- Git hooks (e.g., pre-commit) can be configured separately using tools like Husky.
- Project generation scripts can call post-generation hooks.

## Custom Hooks
Create new hooks by adding files to the \`hooks/\` directory following the JSON and .sh naming convention:
\`\`\`json
{
  "name": "custom-hook",
  "description": "Custom hook description",
  "script": "#!/bin/bash\\necho 'Custom hook executed'",
  "triggers": ["commit", "deploy"], // Define when it should run
  "enabled": true
}
\`\`\`

## Configuration
Enable/disable hooks in their JSON configuration files by setting \`"enabled": false\`.
`;
  await fs.writeFile(path.join(kiroDir, 'hooks/README.md'), hooksReadme);
}

async function generateMcp(kiroDir: string) {
  const projectDir = kiroDir.replace('/.kiro', ''); // Infer project dir from kiroDir
  const mcpConfig = {
    version: '1.0',
    servers: {
      'file-system': {
        command: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', projectDir],
        env: {
          ALLOWED_PATHS: projectDir,
        },
      },
      postgres: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-postgres'],
        env: {
          DATABASE_URL:
            process.env.DATABASE_URL || 'postgresql://localhost:5432/app',
        },
      },
      github: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        },
      },
    },
    tools: {
      'read-file': {
        description: 'Read contents of a file',
        server: 'file-system',
      },
      'write-file': {
        description: 'Write content to a file',
        server: 'file-system',
      },
      'list-directory': {
        description: 'List directory contents',
        server: 'file-system',
      },
      'execute-command': {
        description: 'Execute a shell command (use cautiously)',
        // Note: Execution is often handled by the client or a specific server
        server: null, // Or point to a custom execution server if available
      },
      'query-database': {
        description: 'Execute SQL queries on PostgreSQL',
        server: 'postgres',
      },
      'github-search': {
        description: 'Search GitHub repositories and code',
        server: 'github',
      },
    },
  };

  await fs.writeFile(
    path.join(kiroDir, 'mcp/config.json'),
    JSON.stringify(mcpConfig, null, 2)
  );

  const mcpReadme = `# Model Context Protocol (MCP) Integration

## Configuration
MCP servers are configured in \`mcp/config.json\`. The configuration specifies available servers and their environment variables. The file is generated based on the project directory and environment.

### Available Servers
- **file-system**: Provides access to the project's file system (\`${projectDir}\`).
- **postgres**: Provides access to the PostgreSQL database.
- **github**: Provides access to GitHub API (requires token).

### Running MCP Servers
\`\`\`bash
# Test file system server (replace [PROJECT_DIR] with actual path)
npx @modelcontextprotocol/server-filesystem ${projectDir}

# Test PostgreSQL server (requires DATABASE_URL)
npx @modelcontextprotocol/server-postgres
\`\`\`

## Integration with Kiro
MCP tools are available to Kiro agents if configured in their agent definition's \`tools\` field.

### Agent Tool Access (Example)
\`\`\`json
{
  "tools": [
    "read-file",
    "write-file",
    "list-directory",
    "query-database"
  ]
}
\`\`\`

## Security Notes
- File system access is restricted to the project directory (\`${projectDir}\`).
- Database operations use connection pooling via the specified DATABASE_URL.
- GitHub access requires an explicit GITHUB_TOKEN environment variable.
- All operations should be logged for audit purposes (implementation dependent).
`;
  await fs.writeFile(path.join(kiroDir, 'mcp/README.md'), mcpReadme);
}

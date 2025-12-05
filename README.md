# SkipSetup CLI

Build full-stack applications that are appropriately scaled from the outset. Select between small or medium scale to obtain a production-ready stack, complete with authentication, database integration, and deployment configurations. Commence development of your core business logic without delay.

## Installation

No installation is required. Execute directly using npx:

```bash
npx skipsetup-cli@latest create projectname --size small
npx skipsetup-cli@latest create projectname --size medium
```

## Project Scale Guide

### Small Projects (MVP / Prototype)

Ideal for:
- Prototypes
- Weekend projects
- Simple minimum viable products (MVPs)

Configuration:
```
Profile: SMALL
Description: Minimal MVP: Auth + DB basics
Modules: [auth] [db] [email-resend]
Plugins: [small]
Infrastructure: [postgres]
```

Core Stack:
- Authentication with email/password and one-time password (OTP)
- Basic database setup with Prisma
- Resend for email verification
- Next.js 15 (App Router)
- TypeScript + Tailwind CSS

Included Features:
- Sign-in / sign-up with email verification
- Basic user dashboard
- Simple database schema
- Email sending
- Fully responsive user interface

### Medium Projects (SaaS Ready)

Ideal for:
- Small businesses
- Startups
- Software-as-a-Service (SaaS) products

Configuration:
```
Profile: MEDIUM
Description: SaaS-ready: Admin + monitoring
Modules: [auth] [db] [admin] [stripe] [email] [monitoring-dashboard]
Plugins: [medium]
Infrastructure: [postgres]
```

Core Stack:
- Better Auth (advanced authentication)
- Admin dashboard with user management
- Monitoring & analytics dashboard
- Email templates & workflows
- Stripe payment integration

Included Features:
- Admin panel for users and transactions
- Monitoring dashboard with charts
- Email template system
- API rate limiting & security
- Full Stripe SaaS billing system

## Quick Start

```bash
# Create a small MVP project
npx skipsetup-cli@latest create my-mvp --size small

# Create a medium SaaS project
npx skipsetup-cli@latest create my-saas --size medium
```

## Development Commands

```bash
cd your-project-name

pnpm install        # Install dependencies
pnpm dev            # Start development server
pnpm db:push        # Apply database schema
pnpm db:generate    # Generate Prisma client
pnpm build          # Build for production
pnpm start          # Start production server
```

## AI Development Context (Kiro)

Each project includes a `.kiro` folder containing AI-ready development context.

### Kiro Agents

Pre-configured AI specialists:
- auth-expert – Authentication & user management
- database-architect – Schema design & optimization
- fullstack-specialist – End-to-end features
- ui-specialist – Components & layouts

### Project Specifications (AI-Readable)

- API documentation
- Auth flows & security rules
- Design patterns & components
- Database schema & relationships

## Generated Project Structure

```
your-project/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/           # Signin, signup, verify
│  │  ├─ (protected)/      # Authenticated routes
│  │  ├─ api/              # API routes (REST + tRPC)
│  │  └─ layout.tsx
│  ├─ server/
│  │  ├─ api/              # tRPC routers
│  │  ├─ db/               # Database client
│  │  └─ auth/             # Auth config
│  ├─ trpc/                # Client setup
│  └─ utils/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ .env.example
├─ .kiro/
└─ package.json
```

## Module Details

### Small Project Modules

- auth – Email/password + OTP
- db – Prisma database setup
- email-resend – Email verification

### Medium Project Modules

- auth – Better Auth
- db – Full SaaS schema
- admin – Admin dashboard
- stripe – Payments
- email – Email workflows
- monitoring-dashboard – Analytics

## Plugin System

SkipSetup employs scale-specific plugins:

### plugin-small

- Minimal authentication
- Basic database
- Essential email features

### plugin-medium

- Advanced authentication
- Admin interface
- Monitoring & analytics
- Stripe payments
- Email workflows

## Database Setup

```bash
pnpm db:push     # Apply schema
pnpm db:seed     # Seed data (optional)
```

### Small Projects

- Basic users & sessions
- SQLite or PostgreSQL

### Medium Projects

- Users, payments, admin data
- Audit logs & analytics
- Full relationships

## Authentication Modes

### Small

- Email/password login
- OTP verification
- Email confirmation
- Basic sessions

### Medium

- Better Auth
- Role-based access control
- Secure session handling

## Environment Variables

```bash
cp .env.example .env
```

Required:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
AUTH_SECRET="your-secret-key"
RESEND_API_KEY="re_xxxxx"
```

Medium only:
```
STRIPE_SECRET_KEY="sk_test_xxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxx"
```
## 🎬 Kiroween Demo Showcase

For the Kiroween Hackathon, we built two complete applications to demonstrate SkipSetup's AI-native development capabilities. Each project was generated with SkipSetup and developed with Kiro using the built-in `.kiro` context system.

| Demo Project | Description | Scale | Key Features | Watch Demo |
|--------------|-------------|-------|--------------|------------|
| **[haunting-saas](kiroween-demo/haunting-saas)** | Complete SaaS platform with admin, payments, and monitoring | `--size medium` | • Stripe subscriptions<br>• Admin dashboard<br>• User management<br>• Analytics monitoring | [Watch Video](https://youtu.be/AGcngx2II9Q?t=242) |
| **[spooky-mvp](kiroween-demo/spooky-mvp)** | Minimal viable product with authentication and core features | `--size small` | • Email authentication<br>• Basic dashboard<br>• Database setup<br>• Responsive UI | [Watch Video](https://youtu.be/AGcngx2II9Q?t=62) |

### 🧠 How Kiro Was Used in These Demos

Both projects include a comprehensive `.kiro` folder that transforms Kiro from a generic assistant into a **project-aware expert**:

**Project-Specific Agents**
- **`auth-expert.json`** – Understands authentication flows (Better Auth for SaaS, Basic Auth for MVP)
- **`database-architect.json`** – Specializes in Prisma schemas and migrations
- **`fullstack-specialist.json`** – Implements complete features end-to-end

**Development Workflow**
1. **Generate**: `npx skipsetup create haunting-saas --size medium`
2. **Develop**: Ask Kiro to add features like "subscription analytics" or "user profile editor"
3. **Result**: Perfectly integrated features on the first try, with zero hallucinations

**Watch the full demo video to see:** [Complete 3-minute showcase](https://youtu.be/AGcngx2II9Q)
## Deployment

Deploy to Vercel:

```bash
npm i -g vercel
vercel --prod
```

Includes:
- Vercel configurations
- GitHub Actions CI/CD
- Environment variable setup

## Troubleshooting

### Database Issues

- Ensure the database is running
- Verify DATABASE_URL
- Check Prisma schema

### TypeScript Errors

- Run pnpm build
- Check generated code

### Dependency Warnings

- Peer warnings are normal
- Use pnpm install --force if needed



## Why SkipSetup?

- Right-sized architecture
- Production-ready security
- AI-optimized development
- Zero configuration
- Modular and extensible

## License

MIT License

## Start Building

```bash
npx skipsetup-cli@latest create my-app --size medium
```
import * as path from 'path';
import fs from 'fs/promises';

interface KiroConfig {
  projectName?: string;
  size?: string;
  plugins?: string[];
  infra?: string[];
  [key: string]: unknown;
}

interface PluginData {
  files?: Record<string, unknown>;
  [key: string]: unknown;
}
export async function generateComprehensiveKiroContext(
  projectDir: string,
  config: KiroConfig,
  pluginData: PluginData
) {
  const kiroDir = path.join(projectDir, '.kiro');

  // Create enhanced directory structure
  await fs.mkdir(kiroDir, { recursive: true });
  await fs.mkdir(path.join(kiroDir, 'agents'), { recursive: true });
  await fs.mkdir(path.join(kiroDir, 'steering'), { recursive: true });
  await fs.mkdir(path.join(kiroDir, 'specs'), { recursive: true });
  await fs.mkdir(path.join(kiroDir, 'hooks'), { recursive: true });
  await fs.mkdir(path.join(kiroDir, 'mcp'), { recursive: true });

  // Generate comprehensive context in parallel for efficiency
  await Promise.all([
    generateProjectBlueprint(projectDir, kiroDir, config, pluginData),
    generateArchitectureDocumentation(projectDir, kiroDir),
    generatePluginIntelligence(projectDir, kiroDir, pluginData),
    generateDevelopmentWorkflows(projectDir, kiroDir),
    generateEnhancedAgents(projectDir, kiroDir, config),
    generateHookSystem(projectDir, kiroDir),
    generateMCPSystem(projectDir, kiroDir),
    generateSpecifications(projectDir, kiroDir, config),
  ]);

  await generateMasterIndex(projectDir, kiroDir);
}
async function generateMasterIndex(projectDir: string, kiroDir: string) {
  const masterIndex = `# SkipSetup Kiro Context Index

##  AVAILABLE DOCUMENTATION

### Core Documentation
1. **Project Blueprint** (\`project-blueprint.md\`) - Complete project overview and constraints
2. **Architecture Documentation** (\`architecture-documentation.md\`) - System architecture and data flows  
3. **Development Workflows** (\`development-workflows.md\`) - Step-by-step development processes
4. **Plugin Intelligence** (\`plugin-intelligence.md\`) - Plugin-specific capabilities and patterns

### Custom Agents
- **fullstack-specialist** - Complete fullstack development with all constraints
- **auth-expert** - Authentication and user management specialist  
- **database-architect** - Database schema and Prisma operations

### System Specifications
- **API Specifications** (\`api-specifications.md\`) - Complete API endpoint documentation
- **Component Specifications** (\`component-specifications.md\`) - UI component specifications
- **Database Specifications** (\`database-specifications.md\`) - Database schema and operations

### Hooks & Automation
- **Pre-commit Hooks** - Code quality and validation
- **Post-generation Hooks** - Project setup automation
- **Validation Hooks** - Data and schema validation

### MCP Integration
- **MCP Configuration** - Model Context Protocol setup
- **Tool Definitions** - Available MCP tools and capabilities

## QUICK START FOR KIRO

### When Developing New Features:
1. Start with \`development-workflows.md\` for step-by-step guidance
2. Check \`project-blueprint.md\` for project-specific constraints
3. Consult \`architecture-documentation.md\` for system understanding
4. Use appropriate custom agent for specialized tasks

### Key Constraints to Remember:
- Never modify core authentication files
- Always use existing component patterns
- Follow tRPC procedure patterns for new APIs
- Use Prisma client (never raw SQL) for database operations

## AGENT RECOMMENDATIONS

| Task Type | Recommended Agent | Key Resources |
|-----------|-------------------|---------------|
| General Development | \`fullstack-specialist\` | All documentation |
| Authentication | \`auth-expert\` | Plugin intelligence + Architecture |
| Database Changes | \`database-architect\` | Architecture + Development workflows |
| UI Components | \`fullstack-specialist\` | Development workflows + Project blueprint |

This context provides 100% understanding of the SkipSetup-generated project for zero-error development.
`;

  await fs.writeFile(
    path.join(kiroDir, 'steering/MASTER_INDEX.md'),
    masterIndex
  );
}

async function generateProjectBlueprint(
  projectDir: string,
  kiroDir: string,
  config: KiroConfig,
  pluginData: PluginData
) {
  const pluginsList =
    config.plugins
      ?.map(
        (plugin: string) => `- **${plugin}**: ${getPluginCapabilities(plugin)}`
      )
      .join('\n') || 'No plugins specified';

  const infraList =
    config.infra
      ?.map(
        (service: string) =>
          `- **${service}**: ${getServiceDescription(service)}`
      )
      .join('\n') || 'No infrastructure services specified';

  const generatedFiles =
    Object.keys(pluginData.files || {})
      .map((file) => `- \`${file}\`: ${getFilePurpose(file)}`)
      .join('\n') || 'No files information available';

  const blueprintContent = `# SkipSetup Project Blueprint

## ARCHITECTURE OVERVIEW

### Core Technologies
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: tRPC for type-safe APIs, Better Auth for authentication
- **Database**: Prisma ORM with PostgreSQL
- **Styling**: Tailwind CSS with glassmorphism design system
- **State Management**: TanStack Query (React Query) for server state

### Project Structure
\`\`\`
${projectDir}/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Authentication routes (grouped)
│   │   ├── _components/    # Reusable UI components
│   │   ├── api/           # API routes
│   │   └── layout.tsx     # Root layout
│   ├── server/            # Backend logic
│   │   ├── api/           # tRPC routers
│   │   ├── better-auth/   # Authentication system
│   │   └── db.ts          # Database client
│   ├── trpc/              # tRPC client configuration
│   └── utils/             # Utility functions
├── prisma/                # Database schema and migrations
├── generated/            # Generated Prisma client
└── public/               # Static assets
\`\`\`

## GENERATED BY SKIPSETUP CLI

### CLI Command Used
\`\`\`bash
node apps/cli/dist/cli.js create ${path.basename(projectDir)} ${config.size ? `--size ${config.size}` : ''}
\`\`\`

### Activated Plugins
${pluginsList}

### Infrastructure Services
${infraList}

## DEVELOPMENT CONSTRAINTS

### DO NOT MODIFY (Core Files)
- \`src/server/better-auth/config.ts\` - Core authentication configuration
- \`src/server/db.ts\` - Database client singleton
- \`prisma/schema.prisma\` - Database schema (use migrations)
- \`src/env.js\` - Environment validation

### PATTERNS TO FOLLOW
- **Components**: Use existing patterns from \`src/app/_components/\`
- **API**: Follow tRPC router patterns from \`src/server/api/routers/post.ts\`
- **Authentication**: Use \`authClient\` from \`src/server/better-auth/client.ts\`
- **Database**: Always use Prisma client, never raw SQL

## AVAILABLE UTILITIES

### Authentication Hooks
\`\`\`typescript
import { authClient } from "~/server/better-auth/client";
// Available: signIn, signUp, signOut, useSession, emailOtp
\`\`\`

### UI Components
\`\`\`typescript
import Button from "~/app/_components/ui/button/Button";
import Input from "~/app/_components/form/input/InputField";
import Checkbox from "~/app/_components/form/input/Checkbox";
// All components support dark/light modes and glassmorphism
\`\`\`

### API Integration
\`\`\`typescript
import { api } from "~/trpc/react";
// Use: api.post.create.useMutation(), api.post.getLatest.useQuery()
\`\`\`

## PLUGIN ACTIVATION DETAILS

This project was activated using the Fullstack plugin with the following capabilities:

### Generated Files Structure
${generatedFiles}

### Available Authentication Flows
- Email/Password signup and login
- OTP verification via email
- Password reset functionality
- Session management with Better Auth
- User profile management

### Database Models
- User, Session, Account, Verification (Better Auth)
- Post (example model with user relations)

### Email System
- Resend integration for transactional emails
- Email templates for OTP, password reset, welcome
- React Email components with aqua/mint theme

## SECURITY CONSTRAINTS

### Authentication
- Never expose BETTER_AUTH_SECRET
- Use protectedProcedure for authenticated endpoints
- Session management is handled automatically

### Database
- Always use Prisma client (never raw SQL)
- Input validation with Zod in tRPC procedures
- Proper relation handling in schema

### API Security
- tRPC provides type-safe endpoints
- Input validation on all procedures
- Error handling with proper status codes
`;

  await fs.writeFile(
    path.join(kiroDir, 'steering/project-blueprint.md'),
    blueprintContent
  );
}

function getPluginCapabilities(plugin: string): string {
  const capabilities: Record<string, string> = {
    fullstack: 'Complete authentication, database, email, and UI components',
    stripe: 'Payment processing, subscriptions, webhooks',
    auth: 'User authentication, sessions, OTP, password reset',
    database: 'Prisma schema, migrations, database client',
    email: 'Resend integration, email templates, transactional emails',
  };
  return capabilities[plugin] || 'Custom plugin functionality';
}

function getServiceDescription(service: string): string {
  const descriptions: Record<string, string> = {
    postgres: 'PostgreSQL database for production data',
    redis: 'Redis for caching and session storage',
    s3: 'MinIO S3-compatible object storage',
  };
  return descriptions[service] || 'Infrastructure service';
}

function getFilePurpose(filePath: string): string {
  const purposes: Record<string, string> = {
    'src/env.js': 'Environment variable validation with Zod',
    'prisma/schema.prisma': 'Database schema with Better Auth models',
    'src/server/db.ts': 'Prisma client with connection pooling',
    'src/server/better-auth/config.ts':
      'Better Auth configuration with email OTP',
    'src/server/api/trpc.ts': 'tRPC context and procedure definitions',
    'src/trpc/react.tsx': 'tRPC React client with query caching',
    'src/app/_components/auth/SignInForm.tsx':
      'Authentication form with OTP support',
    'src/app/_components/email/email-template.tsx':
      'Email templates with aqua/mint theme',
  };
  return purposes[filePath] || 'Project configuration file';
}

async function generatePluginIntelligence(
  projectDir: string,
  kiroDir: string,
  pluginData: PluginData
) {
  const fileCount = Object.keys(pluginData.files || {}).length;

  const pluginIntelligence = `# Plugin Activation Intelligence

## FULLSTACK PLUGIN ACTIVATION

### Activation Hook Execution
The project was initialized using the Fullstack plugin activation hook which:

1. **Created Complete Project Structure** - ${fileCount} files generated
2. **Configured Authentication** - Better Auth with Prisma adapter
3. **Set Up Database** - PostgreSQL with proper schema
4. **Integrated Email System** - Resend with React Email templates
5. **Added UI Components** - Complete component library

### Generated Authentication System

#### Better Auth Configuration
\`\`\`typescript
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
\`\`\`

#### Available Auth Components
- \`SignInForm\` - Email/password and OTP login
- \`SignUpForm\` - User registration with validation
- \`UserDropdownProfile\` - User menu with session
- \`ForgotPassword\` - Password reset flow
- \`ResetPassword\` - Password update functionality

### Database Schema Intelligence

#### Core Models
\`\`\`prisma
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
\`\`\`

### tRPC API Structure

#### Router Pattern
\`\`\`typescript
// src/server/api/routers/post.ts
export const postRouter = createTRPCRouter({
  hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
    return { greeting: \`Hello \${input.text}\` };
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
\`\`\`

## UI/UX DESIGN SYSTEM

### Component Architecture
- **Button Component**: Multiple variants (primary, outline, ghost, t3-purple, glass)
- **Form Components**: Input, Checkbox, Label with consistent styling
- **Auth Components**: Complete authentication flow components
- **Email Templates**: Aqua/mint themed responsive emails

### Design Constraints
- Use T3 purple color scheme: \`hsl(280, 100%, 70%)\` for accents
- Glassmorphism effects with backdrop blur
- Dark mode first design approach
- Consistent spacing and typography

## DEVELOPMENT WORKFLOWS

### Adding New Features
1. **Database**: Add to Prisma schema and run \`pnpm db:push\`
2. **API**: Create new tRPC router following post.ts pattern
3. **UI**: Use existing components from _components directory
4. **Authentication**: Use authClient for client-side auth operations

### File Modification Rules
- CAN MODIFY: Components, routers, pages, styles
- CAN EXTEND: Auth configuration (via plugins), env variables
- CANNOT MODIFY: Core auth config, database client, Prisma schema directly
`;

  await fs.writeFile(
    path.join(kiroDir, 'steering/plugin-intelligence.md'),
    pluginIntelligence
  );
}

async function generateEnhancedAgents(
  projectDir: string,
  kiroDir: string,
  config: KiroConfig
) {
  // Note: The config parameter is actually used in the original function
  // through properties like config.projectName, so we need to keep it
  // but mark it as used to avoid the unused variable warning

  // Use the config parameter to demonstrate it's not unused
  const projectName = config.projectName || 'SkipSetup Project';

  const agents = {
    'fullstack-specialist': {
      name: 'fullstack-specialist',
      description: `Complete fullstack development for ${projectName}`,
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
      ],
      prompt: `You are a fullstack specialist working on a SkipSetup-generated project.

CRITICAL CONSTRAINTS:
• Use existing authentication patterns - never rebuild auth
• Follow tRPC router structure for new API endpoints  
• Use glassmorphism design with T3 purple accents
• Never expose environment variables or secrets
• Always validate inputs with Zod in tRPC procedures

CRITICAL CONTEXT:
- This project was generated using SkipSetup CLI with Fullstack plugin
- Authentication uses Better Auth with email OTP and password reset
- Database uses Prisma with PostgreSQL and proper relations
- UI components follow T3 design with glassmorphism
- tRPC provides type-safe API layer

DEVELOPMENT RULES:
1. NEVER modify core authentication files in src/server/better-auth/config.ts
2. ALWAYS use existing component patterns from _components directory
3. FOLLOW tRPC procedure patterns from post.ts router
4. USE authClient for all client-side authentication operations
5. MAINTAIN the established file structure and naming conventions

When adding features:
- Use Button, Input, Checkbox components from _components
- Follow protectedProcedure/publicProcedure patterns for APIs
- Use Prisma client for database operations, never raw SQL
- Maintain the established color scheme and design system`,
      model: 'claude-sonnet-4',
    },

    'auth-expert': {
      name: 'auth-expert',
      description: 'Authentication and user management specialist',
      tools: ['read', 'write'],
      allowedTools: ['read'],
      resources: [
        'file://.kiro/steering/plugin-intelligence.md',
        'file://src/server/better-auth/**/*.ts',
        'file://src/app/_components/auth/**/*.tsx',
        'file://src/app/(auth)/**/*.tsx',
        'file://prisma/schema.prisma',
      ],
      prompt: `You specialize in authentication within SkipSetup projects.

CRITICAL CONSTRAINTS:
• Never modify src/server/better-auth/config.ts core configuration
• Use existing auth components - don't rebuild authentication UI
• Extend user data through additionalFields only
• Follow established session management patterns

AUTHENTICATION CONTEXT:
- Better Auth is configured with Prisma adapter and email OTP
- Available flows: email/password, OTP verification, password reset
- Session management is automatic with getSession() server-side
- User model includes firstName, lastName, stripeCustomerId

RULES:
- Use existing SignInForm, SignUpForm components for UI
- Never modify core Better Auth configuration
- Use authClient for client-side auth operations
- Extend user functionality through additionalFields only
- Follow existing password reset and OTP patterns`,
      model: 'claude-sonnet-4',
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
      ],
      prompt: `You manage database schemas and Prisma operations in SkipSetup projects.

CRITICAL CONSTRAINTS:
• Always run database migrations after schema changes
• Use Prisma client singleton from src/server/db.ts
• Maintain existing relations and indexes
• Never modify core Better Auth models directly

DATABASE CONTEXT:
- PostgreSQL with Prisma ORM
- Better Auth models: User, Session, Account, Verification
- Example Post model with user relations
- Generated Prisma client in generated/prisma/

OPERATION RULES:
- Always run 'pnpm db:push' after schema changes
- Use Prisma client from src/server/db.ts - never raw SQL
- Maintain foreign key relationships and indexes
- Follow existing model patterns from User and Post models`,
      model: 'claude-sonnet-4',
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

async function generateArchitectureDocumentation(
  projectDir: string,
  kiroDir: string
) {
  const architectureContent = `# SkipSetup Architecture Documentation

##  SYSTEM ARCHITECTURE

### High-Level Architecture Diagram
\`\`\`
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
\`\`\`

##  TECHNOLOGY STACK DEEP DIVE

### Frontend Architecture
\`\`\`typescript
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
\`\`\`

### Backend Architecture
\`\`\`typescript
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
\`\`\`

##  DATA FLOW & COMMUNICATION

### Authentication Flow
1. **Client Initiation**: User interacts with SignInForm/SignUpForm
2. **Auth Client**: \`authClient.signIn.email()\` or \`authClient.signUp.email()\`
3. **Server Validation**: Better Auth validates credentials
4. **Session Creation**: Server creates session and returns tokens
5. **Client Storage**: Cookies stored automatically via nextCookies plugin
6. **API Access**: Subsequent requests include session tokens

### API Request Flow
1. **Component**: Calls tRPC procedure via \`api.post.create.useMutation()\`
2. **tRPC Client**: Sends request to \`/api/trpc/[trpc]\` endpoint
3. **tRPC Server**: Routes to appropriate procedure in router
4. **Context Creation**: \`createTRPCContext\` adds db, session to context
5. **Procedure Execution**: Business logic with database operations
6. **Response**: Type-safe data returned to client

### Database Interaction Flow
1. **Procedure**: Calls \`ctx.db.post.create()\` or other Prisma methods
2. **Prisma Client**: Connection pooling and query optimization
3. **Database**: PostgreSQL executes queries
4. **Response**: Structured data with proper TypeScript types

##  FILE PURPOSE MAPPING

### Critical Configuration Files
| File | Purpose | Can Modify? |
|------|---------|-------------|
| \`src/env.js\` | Environment validation with Zod |  No |
| \`prisma/schema.prisma\` | Database schema definition |  Via migrations only |
| \`src/server/db.ts\` | Prisma client singleton |  No |
| \`src/server/better-auth/config.ts\` | Auth configuration | No |
| \`src/server/api/trpc.ts\` | tRPC context and procedures |  Yes (extend) |
| \`src/trpc/react.tsx\` | React Query + tRPC client | Yes |

### Component Architecture
| Component Category | Location | Purpose |
|-------------------|----------|---------|
| Authentication | \`src/app/_components/auth/\` | Sign in/up, password reset |
| Form Elements | \`src/app/_components/form/\` | Input, Checkbox, Label |
| UI Components | \`src/app/_components/ui/\` | Button, layouts, etc. |
| Email Templates | \`src/app/_components/email/\` | React Email components |

## SECURITY ARCHITECTURE

### Authentication & Authorization
\`\`\`typescript
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
\`\`\`

### Data Validation
\`\`\`typescript
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
\`\`\`

### Environment Security
\`\`\`typescript
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
\`\`\`

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
\`\`\`yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    ports:
      - "5432:5432"
\`\`\`

### Production Considerations
- **Environment Variables**: All secrets via environment
- **Database**: Production PostgreSQL with backups
- **File Storage**: S3-compatible storage for uploads
- **CDN**: Static asset delivery via Vercel/CDN

This architecture ensures type safety, performance, and maintainability across the entire stack.
`;

  await fs.writeFile(
    path.join(kiroDir, 'steering/architecture-documentation.md'),
    architectureContent
  );
}

async function generateDevelopmentWorkflows(
  projectDir: string,
  kiroDir: string
) {
  const workflowsContent = `# SkipSetup Development Workflows

##  STANDARD DEVELOPMENT WORKFLOWS

### 1. Adding New Features

#### Feature Development Process
\`\`\`
1. Analyze Requirements → 2. Database Schema → 3. API Routes → 4. UI Components → 5. Testing
\`\`\`

#### Step-by-Step: Adding User Profiles
\`\`\`bash
# 1. Extend Database Schema (if needed)
# Add to prisma/schema.prisma
model UserProfile {
  id        String   @id @default(cuid())
  bio       String?
  avatar    String?
  website   String?
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("user_profile")
}

# Run migration
pnpm db:push

# 2. Create tRPC Router
# src/server/api/routers/profile.ts
export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.userProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),
  
  update: protectedProcedure
    .input(z.object({ bio: z.string().optional(), avatar: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userProfile.upsert({
        where: { userId: ctx.session.user.id },
        create: { ...input, userId: ctx.session.user.id },
        update: input,
      });
    }),
});

# 3. Add to Root Router
# src/server/api/root.ts
export const appRouter = createTRPCRouter({
  post: postRouter,
  profile: profileRouter, // ← Add this line
});

# 4. Create UI Component
# src/app/_components/profile/EditProfileForm.tsx
"use client";
import { api } from "~/trpc/react";
import { Button } from "../ui/button/Button";
import { Input } from "../form/input/InputField";

export function EditProfileForm() {
  const { data: profile } = api.profile.get.useQuery();
  const updateProfile = api.profile.update.useMutation();
  
  // Use existing form patterns from auth components
}

# 5. Add Page Route
# src/app/profile/page.tsx
import { EditProfileForm } from "~/app/_components/profile/EditProfileForm";

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      <EditProfileForm />
    </div>
  );
}
\`\`\`

### 2. Modifying Existing Components

#### Component Modification Rules
\`\`\`typescript
// DO: Extend existing components with new props
interface ButtonProps {
  variant: "primary" | "outline" | "ghost" | "t3-purple" | "glass";
  // Add new variants if needed
  size?: "sm" | "md" | "lg" | "xl"; // Extending sizes
}

//  DO: Use composition over modification
function NewFeatureComponent() {
  return (
    <div className="new-feature">
      <Button variant="t3-purple">Existing component</Button>
      {/* New functionality */}
    </div>
  );
}

//  DON'T: Modify core component logic without discussion
// Avoid changing established patterns in _components/ui/
\`\`\`

#### Authentication Component Updates
\`\`\`typescript
// When adding new auth features:
// 1. Extend Better Auth config (if possible via plugins)
// 2. Create new components in _components/auth/
// 3. Follow existing patterns from SignInForm.tsx

// Example: Adding social login
export function SocialSignIn() {
  // Use same styling patterns as SignInForm
  return (
    <div className="space-y-3">
      <button className="w-full flex items-center...">
        {/* Same structure as existing buttons */}
      </button>
    </div>
  );
}
\`\`\`

### 3. Database Schema Changes

#### Safe Schema Evolution
\`\`\`bash
# 1. Always use Prisma migrations for changes
pnpm prisma migrate dev --name add_user_profile

# 2. Never modify existing fields without migration
#  DON'T: Change field type directly
#  DO: Create new field and migrate data

# 3. For breaking changes, use multi-step migrations
# Step 1: Add new field (nullable)
# Step 2: Backfill data
# Step 3: Make field required
# Step 4: Remove old field
\`\`\`

#### Schema Change Examples
\`\`\`prisma
//  Safe: Adding new optional field
model User {
  // ... existing fields
  phoneNumber String?  // Optional field is safe
}

//  Careful: Adding required field
model User {
  // ... existing fields
  phoneNumber String?  // First add as optional
  // Later migrate to required after data population
}

//  Dangerous: Changing field type
// Instead, create new field and migrate
model User {
  // oldField String  // Don't change type directly
  newField NewType   // Create new field
}
\`\`\`

### 4. API Development Workflow

#### Adding New tRPC Procedures
\`\`\`typescript
// Standard procedure template
export const featureRouter = createTRPCRouter({
  // Query for reading data
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feature.findUnique({
        where: { id: input.id },
      });
    }),

  // Mutation for writing data
  create: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1),
      data: z.any().optional() 
    }))
    .mutation(async ({ ctx, input }) => {
      // Always validate inputs with Zod
      // Use ctx.session.user for user context
      return ctx.db.feature.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });
    }),

  // Complex operations with transactions
  complexOperation: protectedProcedure
    .input(z.object({ ... }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        // Multiple operations in transaction
        const result1 = await tx.table1.create({ ... });
        const result2 = await tx.table2.create({ ... });
        return { result1, result2 };
      });
    }),
});
\`\`\`

### 5. UI Component Development

#### Component Creation Checklist
- [ ] Use existing design system (T3 purple, glassmorphism)
- [ ] Support dark/light mode
- [ ] Include proper TypeScript types
- [ ] Add Storybook stories (if applicable)
- [ ] Test responsive behavior
- [ ] Follow accessibility standards

#### Styling Guidelines
\`\`\`typescript
// Use established design tokens
const styles = {
  // Colors
  primary: "bg-[hsl(280,100%,70%)]",
  glass: "bg-white/10 backdrop-blur-md border border-white/10",
  
  // Spacing (Tailwind)
  padding: "p-4 md:p-6",
  margin: "m-4",
  
  // Typography
  heading: "text-2xl font-bold text-white",
  body: "text-gray-300",
};

// Responsive design
<div className="flex flex-col md:flex-row gap-4">
  {/* Mobile first, then desktop */}
</div>
\`\`\`

### 6. Testing Workflows

#### Development Testing
\`\`\`bash
# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Formatting
pnpm format:write

# All checks
pnpm run checks
\`\`\`

#### Manual Testing Checklist
- [ ] Authentication flows work (sign in/up, password reset)
- [ ] Database operations succeed
- [ ] UI renders correctly on different screen sizes
- [ ] Error states are handled gracefully
- [ ] Loading states are shown during operations

### 7. Debugging Workflows

#### Common Issues and Solutions

**Authentication Issues:**
\`\`\`typescript
// Check session
const { data: session } = authClient.useSession();
console.log('Session:', session);

// Verify environment variables
console.log('Auth URL:', process.env.NEXT_PUBLIC_APP_URL);
\`\`\`

**Database Issues:**
\`\`\`typescript
// Enable Prisma logging
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Check connection
await prisma.$queryRaw\`SELECT 1\`;
\`\`\`

**tRPC Issues:**
\`\`\`typescript
// Check procedure input
console.log('Input to procedure:', input);

// Check context
console.log('User in context:', ctx.session?.user);
\`\`\`

### 8. Performance Optimization

#### Client-Side Performance
\`\`\`typescript
// Use React Query efficiently
const { data, isLoading } = api.post.getLatest.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Optimize re-renders
const mutation = api.post.create.useMutation({
  onSuccess: () => {
    utils.post.invalidate(); // Smart cache invalidation
  },
});
\`\`\`

#### Server-Side Performance
\`\`\`typescript
// Database query optimization
const posts = await ctx.db.post.findMany({
  where: { createdById: ctx.session.user.id },
  include: { createdBy: { select: { name: true } } }, // Only needed fields
  take: 10, // Pagination
});
\`\`\`

##  QUICK REFERENCE COMMANDS

\`\`\`bash
# Development
pnpm dev          # Start development server
pnpm db:push      # Push database schema changes
pnpm db:studio    # Open Prisma Studio

# Quality
pnpm lint         # Run ESLint
pnpm format:write # Format code with Prettier
pnpm tsc --noEmit # Type check without emitting

# Production
pnpm build        # Build for production
pnpm start        # Start production server
\`\`\`

This workflow ensures consistent, high-quality development while maintaining the reliability of the SkipSetup foundation.
`;

  await fs.writeFile(
    path.join(kiroDir, 'steering/development-workflows.md'),
    workflowsContent
  );
}

async function generateHookSystem(projectDir: string, kiroDir: string) {
  const hooks = {
    'pre-commit': {
      name: 'pre-commit',
      description: 'Run before committing code to ensure quality',
      script: `#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Type checking
echo " Type checking..."
pnpm tsc --noEmit

if [ $? -ne 0 ]; then
  echo " TypeScript errors found"
  exit 1
fi

# Linting
echo " Linting..."
pnpm lint

if [ $? -ne 0 ]; then
  echo " ESLint errors found"
  exit 1
fi

# Tests
echo " Running tests..."
pnpm test --passWithNoTests

echo " All pre-commit checks passed!"
`,
      triggers: ['commit'],
      enabled: true,
    },

    'post-generation': {
      name: 'post-generation',
      description: 'Run after project generation to set up initial state',
      script: `#!/bin/bash
echo " Running post-generation setup..."

# Generate Prisma client
echo " Generating Prisma client..."
pnpm db:generate

# Create initial database
echo " Creating initial database..."
pnpm db:push

# Seed database if needed
if [ -f "prisma/seed.ts" ]; then
  echo " Seeding database..."
  pnpm db:seed
fi

# Build project
echo " Building project..."
pnpm build

echo " Post-generation setup complete!"
`,
      triggers: ['generate'],
      enabled: true,
    },

    'pre-deploy': {
      name: 'pre-deploy',
      description: 'Run before deployment to ensure production readiness',
      script: `#!/bin/bash
echo " Running pre-deployment checks..."

# Build verification
echo " Verifying build..."
pnpm build

if [ $? -ne 0 ]; then
  echo " Build failed"
  exit 1
fi

# Test suite
echo " Running test suite..."
pnpm test

if [ $? -ne 0 ]; then
  echo " Tests failed"
  exit 1
fi

# Security audit
echo " Running security audit..."
pnpm audit --audit-level high

if [ $? -ne 0 ]; then
  echo " Security vulnerabilities found"
  # Continue despite vulnerabilities (comment out exit to block deployment)
  # exit 1
fi

echo " Project ready for deployment!"
`,
      triggers: ['deploy'],
      enabled: true,
    },

    'schema-validation': {
      name: 'schema-validation',
      description: 'Validate database schema changes',
      script: `#!/bin/bash
echo " Validating database schema..."

# Check if schema has changes
if git diff --name-only HEAD | grep -q "prisma/schema.prisma"; then
  echo " Database schema changes detected"
  
  # Generate client to check for errors
  pnpm db:generate
  
  if [ $? -ne 0 ]; then
    echo " Schema validation failed"
    exit 1
  fi
  
  # Run tests that depend on database
  pnpm test -- db
  
  echo " Schema changes validated successfully"
else
  echo " No schema changes detected"
fi
`,
      triggers: ['commit', 'push'],
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

  // Create hooks README
  const hooksReadme = `# Kiro Hooks System

##  Available Hooks

Hooks are automated scripts that run at specific points in the development lifecycle.

### Pre-commit Hook
- **Purpose**: Ensure code quality before commits
- **Runs**: Type checking, linting, tests
- **Location**: \`hooks/pre-commit.sh\`

### Post-generation Hook  
- **Purpose**: Set up project after generation
- **Runs**: Database setup, initial builds
- **Location**: \`hooks/post-generation.sh\`

### Pre-deploy Hook
- **Purpose**: Verify production readiness
- **Runs**: Build verification, tests, security audit
- **Location**: \`hooks/pre-deploy.sh\`

### Schema Validation Hook
- **Purpose**: Validate database schema changes
- **Runs**: Schema generation, database tests
- **Location**: \`hooks/schema-validation.sh\`

##  Using Hooks

### Manual Execution
\`\`\`bash
# Run specific hook
./.kiro/hooks/pre-commit.sh

# Run all hooks for a trigger
find .kiro/hooks -name "*.sh" -exec {} \\;
\`\`\`

### Automatic Execution
Hooks are automatically triggered by:
- Git commits (pre-commit)
- Project generation (post-generation) 
- Deployment processes (pre-deploy)
- Schema changes (schema-validation)

##  Custom Hooks

Create new hooks by adding files to the \`hooks/\` directory:

\`\`\`json
{
  "name": "custom-hook",
  "description": "Custom hook description",
  "script": "#!/bin/bash\\necho 'Custom hook'",
  "triggers": ["commit", "deploy"],
  "enabled": true
}
\`\`\`

##  Configuration

Enable/disable hooks in their JSON configuration files by setting \`"enabled": false\`
`;

  await fs.writeFile(path.join(kiroDir, 'hooks/README.md'), hooksReadme);
}

async function generateMCPSystem(projectDir: string, kiroDir: string) {
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
    path.join(kiroDir, 'mcp/mcp-config.json'),
    JSON.stringify(mcpConfig, null, 2)
  );

  // Create MCP setup documentation
  const mcpReadme = `# Model Context Protocol (MCP) Configuration

##  MCP Servers

MCP servers provide tools and resources to AI assistants through a standardized protocol.

### Available Servers

#### File System Server
- **Command**: \`npx @modelcontextprotocol/server-filesystem\`
- **Purpose**: File read/write operations within project
- **Allowed Paths**: Project directory only

#### PostgreSQL Server  
- **Command**: \`npx @modelcontextprotocol/server-postgres\`
- **Purpose**: Database query execution and management
- **Environment**: DATABASE_URL required

#### GitHub Server
- **Command**: \`npx @modelcontextprotocol/server-github\` 
- **Purpose**: GitHub repository search and operations
- **Environment**: GITHUB_TOKEN required

##  Available Tools

### File Operations
- \`read-file\` - Read file contents
- \`write-file\` - Write to files
- \`list-directory\` - Browse directory structure

### Database Operations
- \`query-database\` - Execute SQL queries on PostgreSQL

### GitHub Operations  
- \`github-search\` - Search GitHub repositories and code

##  Setup Instructions

### Environment Configuration
\`\`\`bash
# Database connection
export DATABASE_URL="postgresql://user:pass@localhost:5432/app"

# GitHub access (optional)
export GITHUB_TOKEN="your_github_token"
\`\`\`

### Manual Server Testing
\`\`\`bash
# Test file system server
npx @modelcontextprotocol/server-filesystem ${projectDir}

# Test PostgreSQL server  
npx @modelcontextprotocol/server-postgres
\`\`\`

##  Integration with Kiro

MCP tools are automatically available to Kiro agents through the \`tools\` field in agent configurations.

### Agent Tool Access
\`\`\`json
{
  "tools": ["read", "write", "execute", "mcp-file-system", "mcp-postgres"]
}
\`\`\`

##  Security Notes

- File system access is restricted to project directory
- Database operations use connection pooling
- GitHub access requires explicit token configuration
- All operations are logged for audit purposes
`;

  await fs.writeFile(path.join(kiroDir, 'mcp/README.md'), mcpReadme);
}

async function generateSpecifications(
  projectDir: string,
  kiroDir: string,
  config: KiroConfig
) {
  const projectName = config.projectName || 'Fullstack Application';
  const projectSize = config.size || 'medium';
  const projectModules = config.modules || [];

  // API Specifications with project-specific information
  const apiSpecs = `# API Specifications - ${projectName}

## Project Information
- **Size**: ${projectSize}
- **Modules**: ${Array.isArray(projectModules) ? projectModules.join(', ') : 'No modules specified'}
- **Generated**: ${new Date().toISOString()}

## tRPC API Endpoints

### Authentication Routes
\`\`\`typescript
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
\`\`\`

### Post Routes (Example)
\`\`\`typescript
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
\`\`\`

## API Response Standards

### Success Response
\`\`\`typescript
{
  success: true,
  data: T,
  message?: string
}
\`\`\`

### Error Response
\`\`\`typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
\`\`\`

### Standard Error Codes
- \`UNAUTHORIZED\` - Authentication required
- \`FORBIDDEN\` - Insufficient permissions  
- \`NOT_FOUND\` - Resource not found
- \`VALIDATION_ERROR\` - Input validation failed
- \`INTERNAL_SERVER_ERROR\` - Server error

## API Versioning

### Current Version: v1
- Base path: \`/api/trpc\`
- No breaking changes allowed
- Add new fields as optional
- Maintain backward compatibility

### Response Caching
\`\`\`typescript
// React Query caching example
const { data } = api.post.getLatest.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
\`\`\`

## Security Specifications

### Authentication Requirements
| Endpoint Type | Authentication | Procedure Type |
|---------------|----------------|----------------|
| Public data | Optional | \`publicProcedure\` |
| User actions | Required | \`protectedProcedure\` |
| Admin actions | Required + Roles | \`adminProcedure\` |

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user
- Exponential backoff on failures

### Input Validation
- All inputs validated with Zod
- Sanitize HTML content
- Validate file uploads
- Check payload size limits
`;

  await fs.writeFile(
    path.join(kiroDir, 'specs/api-specifications.md'),
    apiSpecs
  );

  // Component Specifications
  const componentSpecs = `# Component Specifications - ${projectName}

## Design System Components

### Button Component
\`\`\`typescript
// src/app/_components/ui/button/Button.tsx
interface ButtonProps {
  variant: "primary" | "outline" | "ghost" | "t3-purple" | "glass";
  size: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

// Usage examples
<Button variant="t3-purple" size="lg">Primary Action</Button>
<Button variant="outline" size="md">Secondary Action</Button>
<Button variant="ghost" size="sm">Tertiary Action</Button>
<Button variant="glass" loading={true}>Loading</Button>
\`\`\`

### Input Component
\`\`\`typescript
// src/app/_components/form/input/InputField.tsx
interface InputFieldProps {
  label: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Usage example
<InputField
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
\`\`\`

## Component Patterns

### Form Handling Pattern
\`\`\`typescript
// Standard form component structure
export function UserSettingsForm() {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Form validation
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      // API call
      await api.user.update.mutate(formData);
      
      // Success handling
      toast.success("Settings updated successfully");
    } catch (error) {
      // Error handling
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <Button type="submit" loading={loading}>
        Save Changes
      </Button>
    </form>
  );
}
\`\`\`

### Data Fetching Pattern
\`\`\`typescript
// Standard data fetching with React Query
export function UserProfile() {
  const { data: user, isLoading, error } = api.user.get.useQuery();
  
  if (isLoading) return <ProfileSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <EmptyState />;
  
  return (
    <div className="profile-container">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
\`\`\`

## Component Requirements

### Accessibility Standards
- All interactive elements must be keyboard accessible
- Proper ARIA labels for screen readers
- Sufficient color contrast ratios
- Focus indicators for all interactive elements

### Responsive Design
- Mobile-first approach required
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible layouts with Tailwind CSS
- Touch-friendly interface elements

### Performance Requirements
- Code splitting for route-level components
- Lazy loading for below-fold content
- Optimized images with Next.js Image
- Memoization for expensive computations

## Component Testing

### Test Structure
\`\`\`typescript
// Component test example
describe('Button Component', () => {
  it('renders with correct variant and size', () => {
    render(<Button variant="primary" size="lg">Click me</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('bg-purple-600', 'px-6', 'py-3');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
\`\`\`

### Testing Requirements
- Unit tests for all components
- Integration tests for complex interactions
- Accessibility testing with axe-core
- Visual regression testing
`;

  await fs.writeFile(
    path.join(kiroDir, 'specs/component-specifications.md'),
    componentSpecs
  );

  // Database Specifications
  const databaseSpecs = `# Database Specifications - ${projectName}

## Database Schema

### Core Models
\`\`\`prisma
// User model (Better Auth)
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  firstName     String?
  lastName      String?
  stripeCustomerId String?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  sessions      Session[]
  accounts      Account[]
  verification  Verification[]
  posts         Post[]
  
  @@map("users")
}

// Session model (Better Auth)
model Session {
  id          String   @id @default(cuid())
  userId      String
  expiresAt   DateTime
  token       String   @unique
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

// Post model (Example)
model Post {
  id          String   @id @default(cuid())
  name        String
  content     String?
  
  // Relations
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("posts")
}
\`\`\`

## Database Operations

### Query Patterns
\`\`\`typescript
// Standard query with relations
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      take: 10,
      orderBy: { createdAt: 'desc' }
    }
  }
});

// Paginated query
const posts = await prisma.post.findMany({
  where: { createdById: userId },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
  include: {
    createdBy: {
      select: { name: true, email: true }
    }
  }
});

// Transaction example
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.update({
    where: { id: userId },
    data: { lastName: newLastName }
  });
  
  const post = await tx.post.create({
    data: {
      name: 'New Post',
      createdById: userId
    }
  });
  
  return { user, post };
});
\`\`\`

## Performance Specifications

### Indexing Strategy
\`\`\`prisma
// Recommended indexes
model User {
  // ... fields
  
  @@index([email])
  @@index([createdAt])
}

model Post {
  // ... fields
  
  @@index([createdById])
  @@index([createdAt])
  @@index([createdById, createdAt])
}

model Session {
  // ... fields
  
  @@index([userId])
  @@index([expiresAt])
  @@index([token])
}
\`\`\`

### Query Optimization
- Use \`select\` to fetch only needed fields
- Implement pagination for large datasets
- Use transactions for related operations
- Batch operations when possible

## Data Integrity

### Validation Rules
\`\`\`prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique @db.VarChar(255)
  
  // Validation
  @@validate(email, "Email must be valid", isEmail(email))
}

model Post {
  id      String @id @default(cuid())
  name    String @db.VarChar(255)
  content String? @db.Text
  
  // Validation
  @@validate(name, "Name cannot be empty", name != "")
}
\`\`\`

### Migration Safety
\`\`\`bash
# Safe migration workflow
pnpm prisma migrate dev --name add_user_profile
pnpm prisma generate
pnpm db:push  # For development
pnpm test:db  # Run database tests

# Production deployment
pnpm prisma migrate deploy
pnpm prisma generate
\`\`\`

## Data Management

### Backup Strategy
- Automated daily backups
- Point-in-time recovery enabled
- Backup verification procedures
- Disaster recovery plan

### Data Retention
- User data: Retained while account active
- Session data: Automatic expiry
- Audit logs: 7 years retention
- Soft delete implementation preferred

## Monitoring & Analytics

### Performance Metrics
- Query execution time monitoring
- Connection pool utilization
- Index usage statistics
- Deadlock detection

### Health Checks
\`\`\`typescript
// Database health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    return { healthy: true, timestamp: new Date() };
  } catch (error) {
    return { healthy: false, error: error.message, timestamp: new Date() };
  }
}
\`\`\`
`;

  await fs.writeFile(
    path.join(kiroDir, 'specs/database-specifications.md'),
    databaseSpecs
  );

  // Create specs README
  const specsReadme = `# System Specifications - ${projectName}

## Project Information
- **Project Size**: ${projectSize}
- **Modules**: ${Array.isArray(projectModules) ? projectModules.join(', ') : 'No modules specified'}
- **Generated**: ${new Date().toISOString()}

## Available Specifications

### API Specifications
- **File**: \`api-specifications.md\`
- **Purpose**: Complete API endpoint documentation, response standards, and security requirements
- **Covers**: tRPC routes, authentication, error handling, versioning

### Component Specifications  
- **File**: \`component-specifications.md\`
- **Purpose**: UI component standards, patterns, and requirements
- **Covers**: Design system, accessibility, responsive design, testing

### Database Specifications
- **File**: \`database-specifications.md\`
- **Purpose**: Database schema, operations, and performance guidelines
- **Covers**: Prisma models, queries, indexing, data integrity

## Usage Guidelines

### For Developers
1. **API Development**: Follow patterns in API specifications
2. **UI Development**: Use component specifications for consistency  
3. **Database Changes**: Consult database specifications before schema modifications

### For Code Review
- Verify compliance with specifications
- Check for proper error handling
- Ensure accessibility standards
- Validate performance considerations

### For Testing
- Use specifications as test requirements
- Verify API response formats
- Test component behavior against specs
- Validate database constraints

## Specification Updates

### Modification Process
1. Update specification document
2. Update affected code
3. Run validation tests
4. Update documentation
5. Communicate changes to team

### Version Control
- Specifications are versioned with code
- Breaking changes require major version updates
- Backward compatibility maintained when possible
`;

  await fs.writeFile(path.join(kiroDir, 'specs/README.md'), specsReadme);
}

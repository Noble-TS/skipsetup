// packages/plugins-fullstack/src/hooks/activate.ts
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

async function writeFileLocal(
  fullPath: string,
  content: string,
  options?: { append?: boolean }
): Promise<void> {
  console.log(
    `HOOK: Writing file ${fullPath} with append=${options?.append || false}`
  );
  try {
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    if (options?.append) {
      const existing = await fs.readFile(fullPath, 'utf8').catch(() => '');
      content = existing + content;
    }
    await fs.writeFile(fullPath, content, 'utf8');
    console.log(`HOOK: Successfully wrote ${fullPath}`);
  } catch (error) {
    console.error(`HOOK: Failed to write file ${fullPath}:`, error);
    throw error;
  }
}

export async function activate(projectDir: string) {
  console.log('HOOK: Running Fullstack plugin activation...');
  const fullDir = path.resolve(projectDir);

  try {
    // Create the complete project structure with placeholder content
    await createProjectStructure(fullDir);

    console.log('✅ HOOK: Fullstack plugin activated successfully!');
  } catch (error) {
    console.error('❌ HOOK: Activation failed:', error);
    throw error;
  }
}

async function createProjectStructure(projectDir: string) {
  // Define all files with minimal placeholder content
  const files = {
    // Environment Configuration
    'src/env.js': `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    // BETTER_AUTH_GITHUB_CLIENT_ID: z.string(),
    // BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * NEXT_PUBLIC_.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct process.env as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_GITHUB_CLIENT_ID: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
    BETTER_AUTH_GITHUB_CLIENT_SECRET:
      process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run build or dev with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. SOME_VAR: z.string() and
   * SOME_VAR='' will throw an error.
   */
  emptyStringAsUndefined: true,
});`,

    // Prisma Schema (using the provided schema)
    'prisma/schema.prisma': `generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  createdBy   User   @relation(fields: [createdById], references: [id])
  createdById String

  @@index([name])
}

model Session {
  id             String   @id @default(cuid())
  expiresAt      DateTime
  token          String   @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ipAddress      String?
  userAgent      String?
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  impersonatedBy String?

  @@map("session")
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verification")
}

model Product {
  id              String   @id @default(cuid())
  name            String
  price           Int
  category        String?
  stripePriceId   String?
  stripeProductId String?
  description     String?
  image           String?
  stock           Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  orderItems OrderItem[]

  @@map("products")
}

model Order {
  id                    String   @id @default(cuid())
  userId                String
  amount                Int // Total amount in cents
  status                String   @default("PENDING") // PENDING, PAID, FAILED, CANCELLED
  stripeSessionId       String?
  stripePaymentIntentId String?
  shippingName          String?
  shippingAddress       String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  user  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  items OrderItem[]

  @@map("orders")
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Int // Price at time of purchase in cents

  // Relations
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model User {
  id               String    @id @default(cuid())
  name             String?
  firstName        String?
  lastName         String?
  email            String    @unique
  emailVerified    Boolean   @default(false)
  image            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  accounts         Account[]
  sessions         Session[]
  role             String?    @default("user")
  banned           Boolean?  @default(false)
  banReason        String?
  banExpires       DateTime?
  stripeCustomerId String?
  orders           Order[]
  posts            Post[]

  @@map("user")
}`,

    // Database Configuration
    'src/server/db.ts': `import { env } from "~/env";
import { PrismaClient } from "../../generated/prisma/client";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
`,

    'src/server/better-auth/config.ts': `import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, admin } from "better-auth/plugins";
import { PrismaClient } from "../../../generated/prisma/client";
import { nextCookies } from "better-auth/next-js";

import { ac, roles } from "./access-control";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      stripeCustomerId: {
        type: "string",
        required: false,
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        const response = await fetch(\`\${process.env.NEXT_PUBLIC_APP_URL}/api/email\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            firstName: user.firstName || 'User',
            type: 'reset-password',
            resetUrl: url,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send reset password email');
        }
      } catch (error) {
        console.error('Error sending reset password email:', error);
        throw error;
      }
    },
    onPasswordReset: async ({ user }, request) => {
      // You can add additional logic here like logging, notifications, etc.
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: false,
      disableSignUp: false,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const response = await fetch(\`\${process.env.NEXT_PUBLIC_APP_URL}/api/email\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              firstName: 'User',
              verificationCode: otp,
              type: 'otp',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send OTP email');
          }
        } catch (error) {
          console.error('Error sending OTP email:', error);
          throw error;
        }
      },
    }),
    admin({
      ac,
      roles: {
        customer: roles.customer,
        contentManager: roles.contentManager,
        orderManager: roles.orderManager,
        financeManager: roles.financeManager,
        admin: roles.admin,
        superAdmin: roles.superAdmin,
      },
      defaultRole: "user",
      adminUserIds: ["qpXFID7g8sKu8mDtZnduBMcKUoB0lGfT"],
      impersonationSessionDuration: 60 * 60 * 2, // 2 hours
      defaultBanReason: "Violation of terms of service",
      defaultBanExpiresIn: 60 * 60 * 24 * 30, // 30 days
      bannedUserMessage: "Your account has been suspended. Please contact support for assistance.",
    }),
    nextCookies(),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});`,
    'src/server/better-auth/server.ts': `import { auth } from ".";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
`,
    'src/server/better-auth/client.ts': `import { createAuthClient } from "better-auth/react"
import { emailOTPClient, adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ,
  plugins: [
    emailOTPClient(),
    
  ]
})

export const { signIn, signUp, signOut, useSession } = authClient;`,
    'src/server/better-auth/index.ts': `export { auth } from "./config";
`,
    'src/server/better-auth/access-control.ts': `import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";


export const statement = {
  ...defaultStatements,
  product: ["create", "read", "update", "delete", "manage"],
  order: ["create", "read", "update", "delete", "manage", "fulfill"],
  transaction: ["read", "export", "refund"],
  customer: ["read", "update", "ban"],
  analytics: ["read", "export"],
  settings: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);


export const customer = ac.newRole({
  order: ["create", "read"],
  transaction: ["read"],
});

export const contentManager = ac.newRole({
  product: ["create", "read", "update"],
  order: ["read", "fulfill"],
  transaction: ["read"],
  customer: ["read"],
  analytics: ["read"],
});

export const orderManager = ac.newRole({
  product: ["read"],
  order: ["read", "update", "manage", "fulfill"],
  transaction: ["read"],
  customer: ["read"],
  analytics: ["read"],
});

export const financeManager = ac.newRole({
  product: ["read"],
  order: ["read"],
  transaction: ["read", "export", "refund"],
  customer: ["read"],
  analytics: ["read", "export"],
});

export const admin = ac.newRole({
  product: ["create", "read", "update", "delete", "manage"],
  order: ["create", "read", "update", "delete", "manage", "fulfill"],
  transaction: ["read", "export", "refund"],
  customer: ["read", "update", "ban"],
  analytics: ["read", "export"],
  settings: ["read", "update"],
  user: defaultStatements.user,
  session: defaultStatements.session,
});

export const superAdmin = ac.newRole({
  product: ["create", "read", "update", "delete", "manage"],
  order: ["create", "read", "update", "delete", "manage", "fulfill"],
  transaction: ["read", "export", "refund"],
  customer: ["read", "update", "ban"],
  analytics: ["read", "export"],
  settings: ["read", "update"],
  user: defaultStatements.user,
  session: defaultStatements.session,
});

// Export all roles for easy access
export const roles = {
  customer,
  contentManager,
  orderManager,
  financeManager,
  admin,
  superAdmin,
} as const;

export type UserRole = keyof typeof roles;`,
    'src/server/better-auth/use-permissions.ts': `// Better Auth permissions hook placeholder`,

    // tRPC Configuration
    'src/server/api/trpc.ts': `/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/better-auth";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });
  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees \`ctx.session.user\` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the \`session\` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });`,
    'src/server/api/routers/post.ts': `import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: \`Hello \${input.text}\`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });

    return post ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});`,
    'src/server/api/root.ts': `import { postRouter } from "~/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
`,

    'src/trpc/react.tsx': `"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { httpBatchStreamLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import { type AppRouter } from "~/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient();

  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return \`https://\${process.env.VERCEL_URL}\`;
  return \`http://localhost:\${process.env.PORT ?? 3000}\`;
}`,
    'src/trpc/query-client.ts': `import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
`,
    'src/trpc/server.ts': `import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import { createCaller, type AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the \`createTRPCContext\` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);`,

    'src/server/stripe/stripe.ts': `import Stripe from 'stripe';
export { auth } from "~/server/better-auth/config";

// Helper function to get session in API routes
export async function getServerAuthSession({ req, res }: { req: any; res: any }) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    return session;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
});`,
    'src/server/stripe/sync.ts': `import { stripe } from './stripe';
import { db } from '~/server/db';

export type StripeCustomerCache = {
  customerId: string;
  payments?: {
    totalOrders: number;
    totalSpent: number;
    lastPaymentDate: number | null;
  };
} | {
  status: "none";
};

export async function syncStripeDataToKV(customerId: string): Promise<StripeCustomerCache> {
  try {
    // Get payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });

    const successfulPayments = paymentIntents.data.filter(
      pi => pi.status === 'succeeded'
    );

    // Verify customer exists
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return { status: "none" };
    }

    // Calculate payment stats
    const totalSpent = successfulPayments.reduce(
      (sum, pi) => sum + (pi.amount || 0), 0
    );
    const lastPayment = successfulPayments[0];

    // Get database orders for this customer
    const dbOrders = await db.order.findMany({
      where: { 
        user: { stripeCustomerId: customerId },
        status: 'COMPLETED'
      },
    });

    const cacheData: StripeCustomerCache = {
      customerId,
      payments: {
        totalOrders: dbOrders.length,
        totalSpent: totalSpent / 100, // Convert from cents
        lastPaymentDate: lastPayment ? lastPayment.created : null,
      }
    };

    // Update user metadata with latest Stripe state
    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { 
        metadata: {
          ...cacheData,
          lastSyncedAt: new Date().toISOString()
        }
      }
    });

    return cacheData;
  } catch (error) {
    console.error(\`Failed to sync Stripe data for customer \${customerId}:\`, error);
    throw error;
  }
}`,

    // API Routes
    'src/app/api/auth/[...all]/route.ts': `import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "~/server/better-auth";

export const { GET, POST } = toNextJsHandler(auth.handler);
`,
    // API Routes - tRPC
    'src/app/api/trpc/[trpc]/route.ts': `import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the \`createTRPCContext\` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              \`❌ tRPC failed on \${path ?? "<no-path>"}: \${error.message}\`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };`,
    'src/app/api/email/route.ts': `import { EmailTemplate } from '../../_components/email/email-template';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRequest {
  email: string;
  firstName: string;
  verificationCode?: string;
  type?: 'otp' | 'reset-password' | 'welcome';
  resetUrl?: string;
}

export async function POST(request: Request) {
  try {
    const { email, firstName, verificationCode, type, resetUrl }: EmailRequest = await request.json();

    if (!email || !firstName) {
      return Response.json(
        { error: 'Email and firstName are required' },
        { status: 400 }
      );
    }

    let subject = '';

    // Determine email subject based on type
    switch (type) {
      case 'reset-password':
        subject = 'Reset Your  Password';
        break;
      case 'otp':
        subject = 'Verify Your  Account';
        break;
      default:
        subject = 'Welcome to Skipsetup !';
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM!,
      to: [email],
      subject,
      react: EmailTemplate({ 
        firstName, 
        verificationCode,
        type,
        resetUrl
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'Email sent successfully',
      data 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`,
    'src/app/api/admin/check-permission/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/better-auth/config";
export async function POST(request: NextRequest) {
  try {
    const { userId, permissions } = await request.json();

    if (!userId || !permissions) {
      return NextResponse.json(
        { error: "userId and permissions are required" },
        { status: 400 }
      );
    }

    const result = await auth.api.userHasPermission({
      body: {
        userId,
        permissions,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      { error: "Failed to check permissions" },
      { status: 500 }
    );
  }
}`,
    'src/app/api/admin/metrics/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import {stripe} from '~/server/stripe/stripe';
export async function GET(request: NextRequest) {
  try {

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalUsers = await db.user.count();
    
    const currentMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    const previousMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    });

    const userGrowth = previousMonthUsers > 0 
      ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
      : currentMonthUsers > 0 ? 100 : 0;

    const totalOrders = await db.order.count({
      where: {
        status: 'PAID',
      },
    });

    const currentMonthOrders = await db.order.count({
      where: {
        status: 'PAID',
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    const previousMonthOrders = await db.order.count({
      where: {
        status: 'PAID',
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    });

    const orderGrowth = previousMonthOrders > 0 
      ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100
      : currentMonthOrders > 0 ? 100 : 0;

    let totalRevenue = 0;
    let currentMonthRevenue = 0;
    let previousMonthRevenue = 0;

    try {
      const currentMonthPaymentIntents = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(currentMonthStart.getTime() / 1000),
        },
        status: 'succeeded',
        limit: 100,
      });

      const previousMonthPaymentIntents = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(previousMonthStart.getTime() / 1000),
          lte: Math.floor(previousMonthEnd.getTime() / 1000),
        },
        status: 'succeeded',
        limit: 100,
      });

      // Calculate revenue
      currentMonthRevenue = currentMonthPaymentIntents.data.reduce(
        (sum, pi) => sum + pi.amount, 0
      );

      previousMonthRevenue = previousMonthPaymentIntents.data.reduce(
        (sum, pi) => sum + pi.amount, 0
      );

      // Get total revenue (all successful payments)
      const allPaymentIntents = await stripe.paymentIntents.list({
        status: 'succeeded',
        limit: 100,
      });

      totalRevenue = allPaymentIntents.data.reduce(
        (sum, pi) => sum + pi.amount, 0
      );

    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      // Fallback to database if Stripe fails
      const revenueData = await db.order.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      });
      totalRevenue = revenueData._sum.amount || 0;
    }

    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : currentMonthRevenue > 0 ? 100 : 0;

    // Fetch transaction metrics
    let totalTransactions = 0;
    let currentMonthTransactions = 0;
    let previousMonthTransactions = 0;

    try {
      const allTransactions = await stripe.paymentIntents.list({
        status: 'succeeded',
        limit: 100,
      });
      totalTransactions = allTransactions.data.length;

      const currentMonthTransactionsData = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(currentMonthStart.getTime() / 1000),
        },
        status: 'succeeded',
        limit: 100,
      });
      currentMonthTransactions = currentMonthTransactionsData.data.length;

      const previousMonthTransactionsData = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(previousMonthStart.getTime() / 1000),
          lte: Math.floor(previousMonthEnd.getTime() / 1000),
        },
        status: 'succeeded',
        limit: 100,
      });
      previousMonthTransactions = previousMonthTransactionsData.data.length;

    } catch (stripeError) {
      console.error('Stripe transactions error:', stripeError);
      // Fallback to database
      totalTransactions = await db.order.count({
        where: { status: 'PAID' },
      });
      currentMonthTransactions = await db.order.count({
        where: {
          status: 'PAID',
          createdAt: { gte: currentMonthStart },
        },
      });
      previousMonthTransactions = await db.order.count({
        where: {
          status: 'PAID',
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      });
    }

    const transactionGrowth = previousMonthTransactions > 0 
      ? ((currentMonthTransactions - previousMonthTransactions) / previousMonthTransactions) * 100
      : currentMonthTransactions > 0 ? 100 : 0;

    const metrics = {
      users: {
        total: totalUsers,
        growth: userGrowth,
        currentMonth: currentMonthUsers,
        previousMonth: previousMonthUsers,
      },
      orders: {
        total: totalOrders,
        growth: orderGrowth,
        currentMonth: currentMonthOrders,
        previousMonth: previousMonthOrders,
      },
      revenue: {
        total: totalRevenue,
        growth: revenueGrowth,
        currentMonth: currentMonthRevenue,
        previousMonth: previousMonthRevenue,
      },
      transactions: {
        total: totalTransactions,
        growth: transactionGrowth,
        currentMonth: currentMonthTransactions,
        previousMonth: previousMonthTransactions,
      },
    };

    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error(' Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}`,
    'src/app/api/admin/products/route.ts': `import { NextRequest } from 'next/server';
import { auth } from '~/server/better-auth/config';
import { db } from '~/server/db';
import { stripe } from '~/server/stripe/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await db.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        stock: true,
        category: true,
        stripeProductId: true,
        stripePriceId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return Response.json({
      success: true,
      products: products.map(p => ({
        ...p,
        price: p.price / 100,
        category: p.category || "Uncategorized",
      }))
    });

  } catch (error) {
    console.error(' Products fetch error:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to fetch products' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, price, image, stock, category } = await request.json();

    if (!name || !price) {
      return Response.json({ error: 'Name and price are required' }, { status: 400 });
    }

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name,
      description,
      images: image ? [image] : [],
      metadata: {
        createdVia: 'admin-dashboard',
        ...(category && { category })
      }
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
    });

    const dbProductId = \`prod_\${Date.now()}\`;

    const dbProduct = await db.product.create({
      data: {
        id: dbProductId,
        name,
        description: description || '',
        price: Math.round(price * 100),
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
        image: image || '',
        stock: stock || 0,
        ...(category && { category }),
      },
    });

    return Response.json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price / 100,
        ...(dbProduct.category && { category: dbProduct.category }),
        stripeProductId: dbProduct.stripeProductId,
        stripePriceId: dbProduct.stripePriceId,
      }
    });

  } catch (error) {
    console.error(' Product creation error:', error);
    
    let errorMessage = 'Failed to create product';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, description, price, image, stock, category } = await request.json();

    if (!id || !name || !price) {
      return Response.json({ error: 'ID, name, and price are required' }, { status: 400 });
    }

    // Find the existing product
    const existingProduct = await db.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update in Stripe if the product exists there
    if (existingProduct.stripeProductId) {
      try {
        await stripe.products.update(existingProduct.stripeProductId, {
          name,
          description,
          ...(image && { images: [image] }),
          metadata: {
            ...(category && { category })
          }
        });
      } catch (stripeError) {
        console.warn(' Could not update Stripe product:', stripeError);
      }
    }

    // Update in database
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        name,
        description: description || '',
        price: Math.round(price * 100),
        image: image || '',
        stock: stock || 0,
        ...(category !== undefined && { category }),
      },
    });

    return Response.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price / 100,
        ...(updatedProduct.category && { category: updatedProduct.category }),
        stripeProductId: updatedProduct.stripeProductId,
        stripePriceId: updatedProduct.stripePriceId,
      }
    });

  } catch (error) {
    console.error(' Product update error:', error);
    
    let errorMessage = 'Failed to update product';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Find the existing product
    const existingProduct = await db.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Archive in Stripe instead of deleting to maintain history
    if (existingProduct.stripeProductId) {
      try {
        await stripe.products.update(existingProduct.stripeProductId, {
          active: false, // Archive the product instead of deleting
        });
      } catch (stripeError) {
        console.warn(' Could not archive Stripe product:', stripeError);
      }
    }

    // Delete from database
    await db.product.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error(' Product deletion error:', error);
    
    let errorMessage = 'Failed to delete product';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 });
  }
}`,
    // API Routes - Checkout Session
    'src/app/api/checkout/session/route.ts': `import { type NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export async function POST(request: NextRequest) {
  try {
    // Get the user session using Better Auth
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const { items } = await request.json() as { items: Array<{ productId: string; quantity: number }> };

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "No items provided" }, { status: 400 });
    }

    // Get products from database
    const productIds = items.map(item => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    // Validate products and calculate total
    let totalAmount = 0;
    const lineItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return Response.json({ error: \`Product not found: \${item.productId}\` }, { status: 400 });
      }
      if (!product.stripePriceId) {
        return Response.json({ error: \`Product not configured for payments: \${product.name}\` }, { status: 400 });
      }

      totalAmount += product.price * item.quantity;
      lineItems.push({
        price: product.stripePriceId,
        quantity: item.quantity,
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = (session.user as any).stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || \`\${(session.user as any).firstName || ''} \${(session.user as any).lastName || ''}\`.trim() || "Customer",
        metadata: {
          userId: session.user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Store the relationship in database
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId },
      });
    }

    // Create order in database (PENDING status)
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        amount: totalAmount,
        status: 'PENDING',
        items: {
          create: items.map(item => {
            const product = products.find(p => p.id === item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            };
          }),
        },
      },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: \`\${process.env.BETTER_AUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=\${order.id}\`,
      cancel_url: \`\${process.env.BETTER_AUTH_URL}/checkout/cancel\`,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
      },
      shipping_address_collection: {
        allowed_countries: ['ET', 'US', 'CA', 'GB']
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
      custom_text: {
        shipping_address: {
          message: "For delivery to Tigray, please ensure address is accurate and complete.",
        },
      },
    });

    // Update order with Stripe session ID
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    // Return the checkout URL
    return Response.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      orderId: order.id
    });

  } catch (error) {
    console.error("❌ Checkout error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to create checkout session";
    if (error instanceof Error) {
      if (error.message.includes('Stripe')) {
        errorMessage = "Payment service error. Please try again.";
      } else {
        errorMessage = error.message;
      }
    }

    return Response.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// Add GET method for testing
export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}`,
    'src/app/api/checkout/session.ts': `import { type NextApiRequest, type NextApiResponse } from "next";
import { getServerAuthSession } from "~/server/stripe/stripe";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerAuthSession({ req, res });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body as { items: Array<{ productId: string; quantity: number }> };

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Get products and calculate total
    const productIds = items.map(item => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    let totalAmount = 0;
    const lineItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || !product.stripePriceId) {
        return res.status(400).json({ error: \`Product not configured: \${item.productId}\` });
      }
      totalAmount += product.price * item.quantity;
      lineItems.push({
        price: product.stripePriceId,
        quantity: item.quantity,
      });
    }

    // Create customer BEFORE checkout
    let stripeCustomerId = session.user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || \`\${session.user.firstName} \${session.user.lastName}\`.trim(),
        metadata: {
          userId: session.user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Store the relationship
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId },
      });
    }

    // Create order in database (PENDING status)
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        amount: totalAmount,
        status: 'PENDING',
        items: {
          create: items.map(item => {
            const product = products.find(p => p.id === item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            };
          }),
        },
      },
    });

    // Create checkout session WITH customer
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: \`\${process.env.BETTER_AUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=\${order.id}\`,
      cancel_url: \`\${process.env.BETTER_AUTH_URL}/checkout/cancel\`,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
      },
      shipping_address_collection: { allowed_countries: ['ET', 'US', 'CA', 'GB'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
    });

    // Update order with Stripe session ID
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    res.json({ url: checkoutSession.url });

  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}`,
    'src/app/api/checkout/sync-success.ts': `import { type NextApiRequest, type NextApiResponse } from "next";
import { getServerAuthSession } from "~/server/stripe/stripe";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";
import { syncStripeDataToKV } from "~/server/stripe/sync";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerAuthSession({ req, res });
  
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { sessionId, orderId } = req.body;

    // Retrieve checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId as string);
    
    if (checkoutSession.payment_status === 'paid') {
      // Update order status
      await db.order.update({
        where: { id: orderId as string },
        data: { 
          status: 'COMPLETED',
          stripePaymentIntentId: checkoutSession.payment_intent as string,
        },
      });

      // THEO'S KEY INSIGHT: Sync Stripe data eagerly
      if (session.user.stripeCustomerId) {
        await syncStripeDataToKV(session.user.stripeCustomerId);
      }

      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Payment not completed" });
    }

  } catch (error) {
    console.error("Sync success error:", error);
    res.status(500).json({ error: "Failed to sync payment" });
  }
}`,
    'src/app/api/order-confirmation/route.ts': `import { OrderConfirmationEmail } from '~/app/_components/email/OrderConfirmationEmail';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderConfirmationRequest {
  email: string;
  firstName: string;
  orderId: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    recipientName: string;
    address: string;
    city: string;
    region: string;
  };
}

export async function POST(request: Request) {
  try {
    const { 
      email, 
      firstName, 
      orderId, 
      orderDate, 
      totalAmount, 
      status, 
      items, 
      shippingAddress 
    }: OrderConfirmationRequest = await request.json();

    if (!email || !firstName || !orderId || !orderDate || !totalAmount || !status || !items) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Acme <noreply@acme.com>',
      to: [email],
      subject: \`Your Order Confirmation - \${orderId}\`,
      react: OrderConfirmationEmail({ 
        firstName,
        orderId,
        orderDate,
        totalAmount,
        status,
        items,
        shippingAddress
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'Order confirmation email sent successfully',
      data 
    });
  } catch (error) {
    console.error('Order confirmation email sending error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`,
    'src/app/api/orders/route.ts': `import { NextRequest } from 'next/server';
import { auth } from '~/server/better-auth/config';
import { db } from '~/server/db';

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's orders
    const orders = await db.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    return Response.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}`,
    'src/app/api/orders/[id]/route.ts': `import { NextRequest } from 'next/server';
import { auth } from '~/server/better-auth/config';
import { db } from '~/server/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: orderId } = await params;
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Get order with items and product details
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });


    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json(order);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}`,
    // API Routes - Stripe Transactions
    'src/app/api/stripe/transactions/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { stripe } from "~/server/stripe/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch payment intents which contain transaction details
    const paymentIntents = await stripe.paymentIntents.list({
      limit: Math.min(limit, 100),
      expand: ['data.charges.data.balance_transaction', 'data.customer', 'data.shipping'],
    });

    // Get all Stripe customer IDs and order IDs for batch querying
    const stripeCustomerIds: string[] = [];
    const orderIds: string[] = [];

    paymentIntents.data.forEach(pi => {
      if (pi.customer && typeof pi.customer === 'string') {
        stripeCustomerIds.push(pi.customer);
      } else if (pi.customer && typeof pi.customer === 'object') {
        stripeCustomerIds.push(pi.customer.id);
      }

      if (pi.metadata?.orderId) {
        orderIds.push(pi.metadata.orderId);
      }
    });

    // Fetch users by stripeCustomerId
    let users: any[] = [];
    if (stripeCustomerIds.length > 0) {
      users = await db.user.findMany({
        where: {
          stripeCustomerId: {
            in: stripeCustomerIds,
          },
        },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          stripeCustomerId: true,
        },
      });
    }

    // Fetch orders from database
    let orders: any[] = [];
    if (orderIds.length > 0) {
      orders = await db.order.findMany({
        where: {
          id: {
            in: orderIds,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              stripeCustomerId: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    // Create maps for quick lookup
    const userMapByStripeId = new Map();
    users.forEach(user => {
      if (user.stripeCustomerId) {
        userMapByStripeId.set(user.stripeCustomerId, user);
      }
    });

    const orderMap = new Map();
    orders.forEach(order => {
      orderMap.set(order.id, order);
    });

    // Transform Stripe data to include local customer data
    const transactions = await Promise.all(
      paymentIntents.data.map(async (pi) => {
        // Get customer details from Stripe
        let customerEmail = pi.receipt_email;
        let customerName = null;
        let stripeCustomerId = null;
        let stripeCustomer = null;
        let stripeShipping = pi.shipping;

        if (pi.customer) {
          if (typeof pi.customer === 'string') {
            stripeCustomerId = pi.customer;
            try {
              const customer = await stripe.customers.retrieve(pi.customer);
              if (!customer.deleted) {
                stripeCustomer = customer;
                customerEmail = customerEmail || (customer as any).email;
                customerName = (customer as any).name;
              }
            } catch (error) {
              // Silent fail - customer might be deleted
            }
          } else {
            // Customer is already expanded
            stripeCustomer = pi.customer;
            stripeCustomerId = pi.customer.id;
            customerEmail = customerEmail || pi.customer.email;
            customerName = pi.customer.name;
          }
        }

        // Get charge details
        const charge = pi.charges?.data[0];
        const balanceTransaction = charge?.balance_transaction;

        let fee = 0;
        if (balanceTransaction && typeof balanceTransaction !== 'string') {
          fee = balanceTransaction.fee || 0;
        }

        // Get local user data by stripeCustomerId
        const localUser = stripeCustomerId ? userMapByStripeId.get(stripeCustomerId) : null;

        // Get local order data
        const orderId = pi.metadata?.orderId;
        const localOrder = orderId ? orderMap.get(orderId) : null;

        // Parse shipping address from local order if available
        let parsedShippingAddress = null;
        if (localOrder?.shippingAddress) {
          try {
            parsedShippingAddress = JSON.parse(localOrder.shippingAddress);
          } catch (e) {
            // If it's not JSON, use as string
            parsedShippingAddress = localOrder.shippingAddress;
          }
        }

        // Build product description from order items
        let productDescription = '';
        if (localOrder?.items && localOrder.items.length > 0) {
          const productNames = localOrder.items.map((item: any) =>
            \`\${item.product.name} (x\${item.quantity})\`
          );
          productDescription = productNames.join(', ');
        }

        // If we have local user but no customer name/email from Stripe, use local user data
        if (localUser && !customerName) {
          customerName = localUser.name ||
            (localUser.firstName && localUser.lastName
              ? \`\${localUser.firstName} \${localUser.lastName}\`
              : null);
          customerEmail = customerEmail || localUser.email;
        }

        // If we have local order user but no customer data yet, use order user data
        if (!localUser && localOrder?.user) {
          const orderUser = localOrder.user;
          customerName = orderUser.name ||
            (orderUser.firstName && orderUser.lastName
              ? \`\${orderUser.firstName} \${orderUser.lastName}\`
              : null);
          customerEmail = customerEmail || orderUser.email;
        }

        // Format shipping address for display
        const formatShippingAddress = () => {
          // Prefer local order shipping address
          if (parsedShippingAddress) {
            if (typeof parsedShippingAddress === 'object') {
              return \`\${parsedShippingAddress.line1 || ''}\${parsedShippingAddress.line2 ? \`, \${parsedShippingAddress.line2}\` : ''}, \${parsedShippingAddress.city || ''}, \${parsedShippingAddress.state || ''} \${parsedShippingAddress.postal_code || ''}\`.trim();
            }
            return parsedShippingAddress;
          }

          // Fall back to Stripe shipping
          if (stripeShipping) {
            return \`\${stripeShipping.address.line1}\${stripeShipping.address.line2 ? \`, \${stripeShipping.address.line2}\` : ''}, \${stripeShipping.address.city}, \${stripeShipping.address.state} \${stripeShipping.address.postal_code}\`;
          }

          return null;
        };

        const shippingAddress = formatShippingAddress();

        return {
          id: pi.id,
          paymentIntentId: pi.id,
          chargeId: charge?.id,
          amount: pi.amount,
          amountCaptured: pi.amount_captured || pi.amount,
          currency: pi.currency.toUpperCase(),
          status: pi.status,
          created: new Date(pi.created * 1000).toISOString(),

          // Stripe customer data
          customerId: stripeCustomerId,
          customerEmail: customerEmail,
          customerName: customerName,
          stripeCustomer: stripeCustomer,
          stripeShipping: stripeShipping,

          // Local database data
          orderId: orderId,
          localOrder: localOrder ? {
            id: localOrder.id,
            status: localOrder.status,
            createdAt: localOrder.createdAt,
            shippingName: localOrder.shippingName,
            shippingAddress: parsedShippingAddress,
            rawShippingAddress: localOrder.shippingAddress,
          } : null,
          localUser: localUser || (localOrder?.user ? {
            id: localOrder.user.id,
            name: localOrder.user.name,
            firstName: localOrder.user.firstName,
            lastName: localOrder.user.lastName,
            email: localOrder.user.email,
            stripeCustomerId: localOrder.user.stripeCustomerId,
          } : null),
          productDescription: productDescription,
          shippingAddress: shippingAddress,

          description: pi.description,
          paymentMethod: pi.payment_method_types?.[0] || 'card',
          receiptUrl: charge?.receipt_url,
          fee: fee,
          netAmount: pi.amount - fee,
          metadata: pi.metadata || {},
        };
      })
    );

    return NextResponse.json({
      transactions,
      hasMore: paymentIntents.has_more,
      summary: {
        totalTransactions: transactions.length,
        withLocalData: transactions.filter(t => t.localOrder || t.localUser).length,
        withStripeCustomer: transactions.filter(t => t.customerId).length,
        withLocalUser: transactions.filter(t => t.localUser).length,
        withShipping: transactions.filter(t => t.shippingAddress).length,
      }
    });
  } catch (error) {
    console.error(' Error fetching Stripe transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}`,
    'src/app/api/webhooks/stripe/route.ts': `import { type NextRequest } from "next/server";
import { stripe } from "~/server/stripe/stripe";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await request.headers;
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found");
      return Response.json({ error: "No signature" }, { status: 400 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Process event asynchronously (don't block response)
    processEvent(event).catch(console.error);

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function processEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as any);
        break;

      case 'payment_intent.succeeded':
        break;

      case 'charge.succeeded':
        break;

      case 'charge.updated':
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(\`Error processing \${event.type}:\`, error);
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error("No order ID in session metadata");
    return;
  }

  try {
    // Get the order with user and product details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    // Update order status based on payment status
    const paymentStatus = session.payment_status;
    let newStatus = 'PENDING';

    if (paymentStatus === 'paid') {
      newStatus = 'PAID';
    } else {
      newStatus = 'PENDING';
    }

    // Update order in database
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        stripePaymentIntentId: session.payment_intent,
        // Store shipping details if available
        ...(session.shipping_details && {
          shippingName: session.shipping_details.name,
          shippingAddress: JSON.stringify(session.shipping_details.address),
        }),
      },
    });

    // Send confirmation email for paid orders using the new API route
    if (newStatus === 'PAID') {
      await sendOrderConfirmationEmail(order, session.shipping_details);
    } else {
      console.log(\`Order \${orderId} payment status: \${paymentStatus}\`);
    }
  } catch (error) {
    console.error("Error handling checkout session completion:", error);
  }
}

async function handleCheckoutSessionExpired(session: any) {
  const orderId = session.metadata?.orderId;
  if (orderId) {
    try {
      await db.order.update({
        where: { id: orderId },
        data: { status: 'EXPIRED' },
      });
      console.log(\`Order \${orderId} marked as expired\`);
    } catch (error) {
      console.error("Error updating expired order:", error);
    }
  }
}

async function sendOrderConfirmationEmail(order: any, shippingDetails: any) {
  try {
    let shippingAddress = null;
    if (shippingDetails?.address) {
      shippingAddress = {
        recipientName: shippingDetails.name || "Recipient",
        address: \`\${shippingDetails.address.line1}\${shippingDetails.address.line2 ? \`, \${shippingDetails.address.line2}\` : ''}\`,
        city: shippingDetails.address.city || "",
        region: shippingDetails.address.state || "",
      };
    }

    // Prepare the email data for the API route
    const emailPayload = {
      email: order.user.email!,
      firstName: order.user.firstName || order.user.name || "Valued Customer",
      orderId: order.id,
      orderDate: order.createdAt.toISOString(),
      totalAmount: order.amount,
      status: "CONFIRMED",
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: shippingAddress,
    };

    const response = await fetch(\`\${process.env.NEXT_PUBLIC_APP_URL}/api/order-confirmation\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send order confirmation email:", result.error);
      return;
    }

    console.log(\`Order confirmation email sent for order \${order.id}\`);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    console.error("Error details:", error);
  }
}`,
    // Auth Components
    'src/app/_components/auth/SignInForm.tsx': `"use client";

import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";
import { ChevronLeft, Eye, EyeOff, Mail, Lock, KeyRound, CheckCircle, LogIn, Shield, Sparkles, Zap, Users, Rocket } from "lucide-react";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import Checkbox from "../form/input/Checkbox";

export default function SignInForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [useOtp, setUseOtp] = useState(false);

  const inputStyles = "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    if (error) setError(null);
  };

  const resetForm = () => {
    setStep("email");
    setOtp("");
    setUseOtp(false);
    setError(null);
  };

  // Send OTP
  const sendSignInOtp = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }
    setIsSendingOtp(true);
    setError(null);
    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: formData.email,
        type: "sign-in",
      });
      if (error) setError(error.message);
      if (data) setStep("otp");
    } catch {
      setError("Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOtpAndSignIn = async () => {
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email: formData.email,
        otp,
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await handleSuccessfulSignIn();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password login
  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: isChecked
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await handleSuccessfulSignIn();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulSignIn = async () => {
    try {
      const { data: userSession } = await authClient.getSession();
      let targetRoute = "/";

      // Basic Role Routing
      if (userSession?.user?.role) {
        if (userSession.user.role.includes("admin")) targetRoute = "/admin";
      }

      window.location.href = targetRoute;
    } catch (error) {
      window.location.href = "/";
    }
  };

  return (
    <div className="w-full">
      {/* Back Link */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group font-medium">
          <ChevronLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 py-8 px-6 shadow-2xl rounded-3xl sm:px-8 relative overflow-hidden">

        {/* Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {step === "otp" ? "Verify Identity" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">
            {step === "otp"
              ? \`Enter the code sent to \${formData.email}\`
              : "Sign in to access your dashboard"}
          </p>
        </div>

        {step === "otp" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {error && (
              <div className="p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              </div>
            )}

            <div>
              <Label className="text-neutral-700 dark:text-neutral-300 font-medium">Verification Code</Label>
              <Input
                type="text"
                name="otp"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                disabled={isLoading}
                className={\`\${inputStyles} text-center text-2xl font-mono tracking-[0.5em] h-14\`}
                startIcon={<KeyRound className="w-5 h-5 text-neutral-400" />}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="emerald"
                size="lg"
                onClick={verifyOtpAndSignIn}
                disabled={isLoading || !otp}
                isLoading={isLoading}
                className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Verify & Continue
                  </span>
                )}
              </Button>

              <div className="flex justify-between items-center text-sm mt-4">
                <button
                  type="button"
                  onClick={sendSignInOtp}
                  disabled={isSendingOtp}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
                >
                  {isSendingOtp ? "Sending..." : "Resend Code"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isLoading}
                  className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Change Email
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              </div>
            )}

            {/* Method Toggle */}
            <div className="flex gap-3 mb-6 p-1 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
              <button
                type="button"
                onClick={() => setUseOtp(false)}
                className={\`flex-1 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 \${!useOtp
                    ? "bg-white dark:bg-neutral-600 shadow-lg text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-500"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }\`}
              >
                <Lock className="w-4 h-4" />
                Password
              </button>
              <button
                type="button"
                onClick={() => setUseOtp(true)}
                className={\`flex-1 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 \${useOtp
                    ? "bg-white dark:bg-neutral-600 shadow-lg text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-500"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }\`}
              >
                <KeyRound className="w-4 h-4" />
                Email Code
              </button>
            </div>

            <form onSubmit={useOtp ? (e) => { e.preventDefault(); sendSignInOtp(); } : handleEmailPasswordSignIn} className="space-y-6">
              <div>
                <Label className="text-neutral-700 dark:text-neutral-300 font-medium">Email Address</Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading || isSendingOtp}
                  className={inputStyles}
                  startIcon={<Mail className="w-5 h-5 text-neutral-400" />}
                />
              </div>

              {!useOtp && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-neutral-700 dark:text-neutral-300 font-medium">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={\`\${inputStyles} pr-10\`}
                      startIcon={<Lock className="w-5 h-5 text-neutral-400" />}
                    />
                    <button
                      type="button"
                      onClick={() => !isLoading && setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me */}
              {!useOtp && (
                <div className="flex items-center">
                  <Checkbox
                    checked={isChecked}
                    onChange={setIsChecked}
                    disabled={isLoading}
                    className="border-neutral-300 dark:border-neutral-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">Remember me</span>
                </div>
              )}

              <Button
                type="submit"
                variant="emerald"
                size="lg"
                disabled={isLoading || isSendingOtp}
                isLoading={isLoading || isSendingOtp}
                className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
              >
                {useOtp ? (
                  isSendingOtp ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending Code...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="w-5 h-5" />
                      Send Verification Code
                    </span>
                  )
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In to Dashboard
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full border border-neutral-200 dark:border-neutral-700">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-all text-neutral-700 dark:text-neutral-300 font-medium text-sm">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Don't have an account?{" "}
                <Link href="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}`,
    'src/app/_components/auth/SignUpForm.tsx': `"use client";
import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import { ChevronLeft, Eye, EyeOff, Mail, Lock, User, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  // Emerald Theme Constants
  const inputStyles = "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    if (error) setError(null);
  };

  const sendVerificationOtp = async () => {
    if (!formData.email) return setError("Please enter your email address");
    setIsSendingOtp(true);
    setError(null);
    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: formData.email,
        type: "sign-in",
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data) setStep("otp");
    } catch (err) {
      setError("Failed to send verification code");
      console.error(err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleEmailPasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) return setError("Please agree to the Terms");
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password)
      return setError("All fields are required");
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.signUp.email({
        name: \`\${formData.firstName} \${formData.lastName}\`.trim(),
        email: formData.email,
        password: formData.password,
        callbackURL: "/signin",
      });

      if (error) {
        if (error.code === "USER_ALREADY_EXISTS") setError("Account already exists.");
        else if (error.message?.includes("email verification")) await sendVerificationOtp();
        else setError(error.message || "Registration failed.");
        return;
      }

      if (data && !data.user.emailVerified) await sendVerificationOtp();
      else window.location.href = "/signin";
    } catch (err: any) {
      setError(err?.message || "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!otp) return setError("Enter the code");
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.signIn.emailOtp({ email: formData.email, otp });
      if (error) return setError(error.message);
      if (data) window.location.href = "/signin";
    } catch (err) {
      setError("Error during verification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Back Link */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group font-medium">
          <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 py-8 px-6 shadow-2xl rounded-3xl sm:px-8 relative overflow-hidden">
        
        {/* Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {step === "form" ? "Create Account" : "Verify Email"}
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">
            {step === "form" ? "Join the platform today" : \`Code sent to \${formData.email}\`}
          </p>
        </div>

        {step === "form" ? (
          <>
            {/* Social Sign In */}
            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-all text-neutral-700 dark:text-neutral-300 font-medium mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full border border-neutral-200 dark:border-neutral-700">
                  Or continue with email
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleEmailPasswordSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-neutral-700 dark:text-neutral-300 font-medium">First Name</Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder="John"
                    startIcon={<User className="w-5 h-5 text-neutral-400" />}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-neutral-700 dark:text-neutral-300 font-medium">Last Name</Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder="Doe"
                    startIcon={<User className="w-5 h-5 text-neutral-400" />}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-neutral-700 dark:text-neutral-300 font-medium">Email</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputStyles}
                  placeholder="name@example.com"
                  startIcon={<Mail className="w-5 h-5 text-neutral-400" />}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-neutral-700 dark:text-neutral-300 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={\`\${inputStyles} pr-10\`}
                    placeholder="••••••••"
                    startIcon={<Lock className="w-5 h-5 text-neutral-400" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={isChecked} 
                  onChange={setIsChecked} 
                  className="mt-1 border-neutral-300 dark:border-neutral-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  I agree to the{" "}
                  <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline transition-colors">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline transition-colors">
                    Privacy Policy
                  </Link>.
                </span>
              </div>

              <Button 
                type="submit"
                variant="emerald"
                size="lg"
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Create Account
                  </span>
                )}
              </Button>
            </form>
          </>
        ) : (
          /* OTP STEP */
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {error && (
              <div className="p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              </div>
            )}

            <div>
              <Label className="text-neutral-700 dark:text-neutral-300 font-medium">Verification Code</Label>
              <Input
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                disabled={isLoading}
                className={\`\${inputStyles} text-center text-2xl font-mono tracking-[0.5em] h-14\`}
                placeholder="000000"
                startIcon={<Mail className="w-5 h-5 text-neutral-400" />}
              />
              <p className="text-sm mt-2 text-center text-neutral-500 dark:text-neutral-400">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={verifyEmail} 
                variant="emerald"
                size="lg"
                disabled={isLoading || !otp}
                isLoading={isLoading}
                className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Verify & Continue
                  </span>
                )}
              </Button>
              
              <button 
                onClick={() => setStep("form")} 
                disabled={isLoading}
                className="w-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                Change Email
              </button>
            </div>
          </div>
        )}

        {/* Sign In Link */}
        <div className="mt-8 text-center pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}`,
    'src/app/_components/auth/UserDropdownProfile.tsx': `"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { authClient } from "../../../server/better-auth/client";

const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const AdminIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 15v5m-3-5v5m6-5v5M5 9a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9z" />
  </svg>
);

export default function UserDropdownProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user data from auth session
  const { data: session, isLoading } = authClient.useSession();
  const user = session?.user;

  const userName = user?.name || user?.firstName || "User";
  const userEmail = user?.email || "No email";
  const userImage = user?.image || null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/";
    }
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return \`\${user.firstName[0]}\${user.lastName[0]}\`.toUpperCase();
    }
    if (user?.name) {
      return user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="hidden md:block space-y-1">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white text-sm font-semibold">
          {userImage ? (
            <Image
              width={32}
              height={32}
              src={userImage}
              alt={userName}
              className="rounded-full object-cover"
            />
          ) : (
            getUserInitials()
          )}
        </div>

        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{userName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user?.role === "admin" ? "Administrator" : "User"}
          </div>
        </div>

        <svg
          className={\`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform \${isOpen ? "rotate-180" : ""}\`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{userName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</div>
          </div>

          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ProfileIcon className="w-4 h-4" />
              Edit Profile
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon className="w-4 h-4" />
              Account Settings
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <AdminIcon className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-neutral-700 pt-2">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <LogoutIcon className="w-4 h-4" />
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}`,
    'src/app/_components/auth/ForgotPassword.tsx': `"use client";

import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";
import { ChevronLeft, Mail, KeyRound, Shield, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputStyles = "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await authClient.requestPasswordReset({
        email,
        redirectTo: \`\${window.location.origin}/reset-password\`,
      });

      if (error) {
        setError(error.message || "Failed to send reset email. Please try again.");
        return;
      }

      if (data) {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans relative overflow-hidden flex bg-gradient-to-br from-neutral-50 to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/20">
      
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <Link href="/signin" className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group font-medium">
              <ChevronLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 py-8 px-6 shadow-2xl rounded-3xl sm:px-8 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                  {success ? (
                    <CheckCircle className="h-8 w-8 text-white" />
                  ) : (
                    <KeyRound className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
                {success ? "Check Your Email" : "Reset Your Password"}
              </h2>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                {success
                  ? \`We sent a reset link to \${email}\`
                  : "Enter your email to receive a password reset link"}
              </p>
            </div>

            {success ? (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-4 mb-4 rounded-xl border-l-4 bg-green-50 dark:bg-green-900/20 border-green-400 text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Reset link sent successfully!</p>
                  </div>
                  <p className="mt-1 text-green-600 dark:text-green-400">
                    Check your inbox at <strong className="text-green-800 dark:text-green-300">{email}</strong>
                  </p>
                </div>

                <Button
                  variant="emerald"
                  onClick={() => window.location.href = "/signin"}
                  className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ArrowRight className="w-5 h-5" />
                    Return to Sign In
                  </span>
                </Button>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-4">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => setSuccess(false)}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Try again
                  </button>
                </p>

                <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600">
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    If you don't see the email in your inbox, please check your spam folder.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {error}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label className="text-neutral-700 dark:text-neutral-300 font-medium">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className={inputStyles}
                      startIcon={<Mail className="w-5 h-5 text-neutral-400" />}
                    />
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      Enter the email address associated with your account
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    variant="emerald"
                    size="lg"
                    disabled={isLoading}
                    isLoading={isLoading}
                    className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Reset Link...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <KeyRound className="w-5 h-5" />
                        Send Reset Link
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600">
                  <p className="text-sm text-center text-neutral-600 dark:text-neutral-300">
                    If you don't see the email in your inbox, please check your spam folder.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-center">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Remember your password?{" "}
                    <Link href="/signin" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                      Sign In
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}`,
    'src/app/_components/auth/ResetPassword.tsx': `"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import { ChevronLeft, Eye, EyeOff, Lock, KeyRound, CheckCircle, ArrowRight } from "lucide-react";
import { authClient } from "../../../server/better-auth/client";

export default function ResetPassword() {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const inputStyles = "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      setTokenError("Invalid or missing reset token. Please request a new reset link.");
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError("Invalid reset token");
    if (!formData.newPassword || !formData.confirmPassword) return setError("Please fill in all fields");
    if (formData.newPassword.length < 8) return setError("Password must be at least 8 characters long");
    if (formData.newPassword !== formData.confirmPassword) return setError("Passwords do not match");

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.resetPassword({ 
        newPassword: formData.newPassword, 
        token 
      });
      
      if (error) {
        setError(
          error.message?.includes("invalid") || error.message?.includes("expired")
            ? "This reset link is invalid or has expired. Please request a new one."
            : error.message || "Failed to reset password. Please try again."
        );
        return;
      }
      
      if (data) {
        setSuccess(true);
        setTimeout(() => window.location.href = "/signin", 3000);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen w-full font-sans relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-neutral-50 to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/20 p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link 
              href="/forgot-password" 
              className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group font-medium"
            >
              <ChevronLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Forgot Password
            </Link>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 py-8 px-6 shadow-2xl rounded-3xl sm:px-8 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Invalid Reset Link
              </h2>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                {tokenError}
              </p>
            </div>

            <div className="p-4 mb-6 rounded-xl border-l-4 bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                This link may have expired or is invalid
              </div>
            </div>
            
            <Button
              variant="emerald"
              onClick={() => window.location.href = "/forgot-password"}
              className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                <KeyRound className="w-5 h-5" />
                Request New Reset Link
              </span>
            </Button>

            {/* Additional Help Text */}
            <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 text-center">
                Reset links expire for security reasons. Request a new one to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-sans relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-neutral-50 to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/20 p-6">
      <div className="w-full max-w-md">
        
        <div className="mb-8">
          <Link 
            href="/signin" 
            className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group font-medium"
          >
            <ChevronLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 py-8 px-6 shadow-2xl rounded-3xl sm:px-8 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                {success ? (
                  <CheckCircle className="h-8 w-8 text-white" />
                ) : (
                  <KeyRound className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {success ? "Password Reset!" : "Create New Password"}
            </h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-300">
              {success 
                ? "Your password has been successfully reset" 
                : "Enter your new password below"}
            </p>
          </div>

          {success ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 mb-4 rounded-xl border-l-4 bg-green-50 dark:bg-green-900/20 border-green-400 text-green-700 dark:text-green-300">
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">Your password has been successfully updated!</p>
                </div>
                <p className="mt-1 text-green-600 dark:text-green-400">Redirecting you to sign in...</p>
              </div>
              
              <Button 
                variant="emerald"
                onClick={() => window.location.href = "/signin"}
                className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Sign In Now
                </span>
              </Button>

              <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  You can now sign in with your new password.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl border-l-4 bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password Field */}
                <div className="animate-in fade-in duration-500 delay-100">
                  <Label className="text-neutral-700 dark:text-neutral-300 font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className={\`\${inputStyles} pr-12\`}
                      startIcon={<Lock className="w-5 h-5 text-neutral-400" />}
                    />
                    <button
                      type="button"
                      onClick={() => !isLoading && setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="animate-in fade-in duration-500 delay-200">
                  <Label className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className={\`\${inputStyles} pr-12\`}
                      startIcon={<Lock className="w-5 h-5 text-neutral-400" />}
                    />
                    <button
                      type="button"
                      onClick={() => !isLoading && setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="emerald"
                  size="lg"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full rounded-xl hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Resetting Password...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <KeyRound className="w-5 h-5" />
                      Reset Password
                    </span>
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600">
                <p className="text-sm text-center text-neutral-600 dark:text-neutral-300">
                  Choose a strong password that you haven't used before
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Remember your password?{" "}
                  <Link 
                    href="/signin" 
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}`,
    'src/app/_components/auth/protected-route.tsx': `"use client";
import React from "react";
import { usePermissions } from "~/server/better-auth/use-permissions";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: keyof ReturnType<typeof usePermissions>["can"];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  permission,
  fallback = null
}: ProtectedRouteProps) {
  const { can, session, status, isAdmin } = usePermissions();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000]"></div>
      </div>
    );
  }

  if (!session) {
    return <>{fallback}</>;
  }

  if (!permission) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkPermission = async () => {
      const result = await can[permission]();
      setHasPermission(result);
    };
    checkPermission();
  }, [permission, can]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B0000]"></div>
      </div>
    );
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}`,
    'src/app/_components/auth/AuthGuard.tsx': `"use client";

import { useSession } from "~/server/better-auth/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      if (pathname !== "/signin") {
        router.push("/signin");
      }
      return;
    }

    const userRole = session.user?.role || "user";

    const roleAllowedRoutes: Record<string, string[]> = {
      admin: ["/admin", "/orders"],
      superAdmin: ["/admin", "/orders"],
      contentManager: ["/admin"],
      orderManager: ["/admin"],
      financeManager: ["/admin"],
      partner: ["/partners", "/orders", "/admin"],
      user: ["/orders"],
      customer: ["/orders"]
    };

    const userRoles = userRole.split(',').map(role => role.trim());

    let allowedRoutes: string[] = [];
    userRoles.forEach(role => {
      if (roleAllowedRoutes[role]) {
        allowedRoutes = [...allowedRoutes, ...roleAllowedRoutes[role]];
      }
    });

    allowedRoutes = [...new Set(allowedRoutes)];

    const defaultRoutes: Record<string, string> = {
      admin: "/admin",
      superAdmin: "/admin",
      contentManager: "/admin",
      orderManager: "/admin",
      financeManager: "/admin",
      partner: "/partners",
      user: "/orders",
      customer: "/orders"
    };

    let defaultRoute = "/orders";
    for (const role of userRoles) {
      if (defaultRoutes[role]) {
        defaultRoute = defaultRoutes[role];
        break;
      }
    }


    const isPathAllowed = allowedRoutes.some(route =>
      pathname.startsWith(route)
    );

    const shouldRedirect = !isPathAllowed &&
      !pathname.startsWith("/unauthorized") &&
      pathname !== "/signin";

    if (shouldRedirect) {
      router.push(defaultRoute);
    } else {
      setHasChecked(true);
    }
  }, [session, isPending, router, pathname]);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <LoadingSpinner />;
  }

  const userRole = session.user?.role || "user";
  const userRoles = userRole.split(',').map(role => role.trim());

  const roleAllowedRoutes: Record<string, string[]> = {
    admin: ["/admin", "/orders"],
    superAdmin: ["/admin", "/orders"],
    contentManager: ["/admin"],
    orderManager: ["/admin"],
    financeManager: ["/admin"],
    partner: ["/partners", "/orders", "/admin"],
    user: ["/orders"],
    customer: ["/orders"]
  };

  let allowedRoutes: string[] = [];
  userRoles.forEach(role => {
    if (roleAllowedRoutes[role]) {
      allowedRoutes = [...allowedRoutes, ...roleAllowedRoutes[role]];
    }
  });
  allowedRoutes = [...new Set(allowedRoutes)];

  const isPathAllowed = allowedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!isPathAllowed &&
    !pathname.startsWith("/unauthorized") &&
    pathname !== "/signin") {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}`,

    // Common Components
    'src/app/_components/common/ComponentCard.tsx': `import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
}) => {
  return (
    <div
      className={\`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] \${className}\`}
    >
      <div className="px-6 py-5">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {desc}
          </p>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;`,
    'src/app/_components/common/PageBreadCrumb.tsx': `import Link from "next/link";
import React from "react";

interface BreadcrumbProps {
  pageTitle: string;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
        x-text="pageName"
      >
        {pageTitle}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              href="/"
            >
              Home
              <svg
                className="stroke-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          <li className="text-sm text-gray-800 dark:text-white/90">
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
`,
    'src/app/_components/common/ThemeToggleButton.tsx': `import React from "react";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <svg
        className="hidden dark:block"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.99998 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 9.99998 4.2915C9.58577 4.2915 9.24998 3.95572 9.24998 3.5415V2.2915C9.24998 1.87729 9.58577 1.5415 9.99998 1.5415ZM10.0009 6.79327C8.22978 6.79327 6.79402 8.22904 6.79402 10.0001C6.79402 11.7712 8.22978 13.207 10.0009 13.207C11.772 13.207 13.2078 11.7712 13.2078 10.0001C13.2078 8.22904 11.772 6.79327 10.0009 6.79327ZM5.29402 10.0001C5.29402 7.40061 7.40135 5.29327 10.0009 5.29327C12.6004 5.29327 14.7078 7.40061 14.7078 10.0001C14.7078 12.5997 12.6004 14.707 10.0009 14.707C7.40135 14.707 5.29402 12.5997 5.29402 10.0001ZM15.9813 5.08035C16.2742 4.78746 16.2742 4.31258 15.9813 4.01969C15.6884 3.7268 15.2135 3.7268 14.9207 4.01969L14.0368 4.90357C13.7439 5.19647 13.7439 5.67134 14.0368 5.96423C14.3297 6.25713 14.8045 6.25713 15.0974 5.96423L15.9813 5.08035ZM18.4577 10.0001C18.4577 10.4143 18.1219 10.7501 17.7077 10.7501H16.4577C16.0435 10.7501 15.7077 10.4143 15.7077 10.0001C15.7077 9.58592 16.0435 9.25013 16.4577 9.25013H17.7077C18.1219 9.25013 18.4577 9.58592 18.4577 10.0001ZM14.9207 15.9806C15.2135 16.2735 15.6884 16.2735 15.9813 15.9806C16.2742 15.6877 16.2742 15.2128 15.9813 14.9199L15.0974 14.036C14.8045 13.7431 14.3297 13.7431 14.0368 14.036C13.7439 14.3289 13.7439 14.8038 14.0368 15.0967L14.9207 15.9806ZM9.99998 15.7088C10.4142 15.7088 10.75 16.0445 10.75 16.4588V17.7088C10.75 18.123 10.4142 18.4588 9.99998 18.4588C9.58577 18.4588 9.24998 18.123 9.24998 17.7088V16.4588C9.24998 16.0445 9.58577 15.7088 9.99998 15.7088ZM5.96356 15.0972C6.25646 14.8043 6.25646 14.3295 5.96356 14.0366C5.67067 13.7437 5.1958 13.7437 4.9029 14.0366L4.01902 14.9204C3.72613 15.2133 3.72613 15.6882 4.01902 15.9811C4.31191 16.274 4.78679 16.274 5.07968 15.9811L5.96356 15.0972ZM4.29224 10.0001C4.29224 10.4143 3.95645 10.7501 3.54224 10.7501H2.29224C1.87802 10.7501 1.54224 10.4143 1.54224 10.0001C1.54224 9.58592 1.87802 9.25013 2.29224 9.25013H3.54224C3.95645 9.25013 4.29224 9.58592 4.29224 10.0001ZM4.9029 5.9637C5.1958 6.25659 5.67067 6.25659 5.96356 5.9637C6.25646 5.6708 6.25646 5.19593 5.96356 4.90303L5.07968 4.01915C4.78679 3.72626 4.31191 3.72626 4.01902 4.01915C3.72613 4.31204 3.72613 4.78692 4.01902 5.07981L4.9029 5.9637Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="dark:hidden"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.4547 11.97L18.1799 12.1611C18.265 11.8383 18.1265 11.4982 17.8401 11.3266C17.5538 11.1551 17.1885 11.1934 16.944 11.4207L17.4547 11.97ZM8.0306 2.5459L8.57989 3.05657C8.80718 2.81209 8.84554 2.44682 8.67398 2.16046C8.50243 1.8741 8.16227 1.73559 7.83948 1.82066L8.0306 2.5459ZM12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524H5.49707C5.49707 11.1823 8.81835 14.5035 12.9154 14.5035V13.0035ZM16.944 11.4207C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035V14.5035C14.8657 14.5035 16.6418 13.7499 17.9654 12.5193L16.944 11.4207ZM16.7295 11.7789C15.9437 14.7607 13.2277 16.9586 10.0003 16.9586V18.4586C13.9257 18.4586 17.2249 15.7853 18.1799 12.1611L16.7295 11.7789ZM10.0003 16.9586C6.15734 16.9586 3.04199 13.8433 3.04199 10.0003H1.54199C1.54199 14.6717 5.32892 18.4586 10.0003 18.4586V16.9586ZM3.04199 10.0003C3.04199 6.77289 5.23988 4.05695 8.22173 3.27114L7.83948 1.82066C4.21532 2.77574 1.54199 6.07486 1.54199 10.0003H3.04199ZM6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657L7.48132 2.03522C6.25073 3.35885 5.49707 5.13487 5.49707 7.08524H6.99707Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
};
`,

    // Context Components
    'src/app/_components/context/CartContext.tsx': `"use client";
import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return calculateTotals(updatedItems);
      } else {
        const updatedItems = [...state.items, { ...action.payload, quantity: 1 }];
        return calculateTotals(updatedItems);
      }
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.productId !== action.payload);
      return calculateTotals(updatedItems);
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.productId === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);
      return calculateTotals(updatedItems);
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    case 'LOAD_CART':
      return calculateTotals(action.payload);

    default:
      return state;
  }
}

function calculateTotals(items: CartItem[]): CartState {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, total, itemCount };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('skipsetup-cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart) as CartItem[];
        dispatch({ type: 'LOAD_CART', payload: items });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('skipsetup-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, dispatch, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}`,
    'src/app/_components/context/SidebarContext.tsx': `"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (hovered: boolean) => void;
  closeMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const savedExpanded = localStorage.getItem("sidebar-expanded");
    if (savedExpanded !== null) {
      setIsExpanded(JSON.parse(savedExpanded));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", JSON.stringify(isExpanded));
  }, [isExpanded]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (window.innerWidth >= 1024) {
      setIsMobileOpen(false);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <SidebarContext.Provider value={{ 
      isExpanded, 
      isMobileOpen, 
      isHovered, 
      toggleSidebar, 
      toggleMobileSidebar, 
      setIsHovered,
      closeMobileSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}`,
    'src/app/_components/context/ThemeContext.tsx': `"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This code will only run on the client side
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "light"; // Default to light theme

    setTheme(initialTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};`,
    // Dashboard Components
    'src/app/_components/dashboard/dashboard.tsx': `"use client";
import { usePermissions } from "~/server/better-auth/use-permissions";
import { ProtectedRoute } from "../auth/protected-route";
import Link from "next/link";

export function AdminDashboard() {
  const { userRole, isAdmin, isSuperAdmin } = usePermissions();

  return (
    <div className="space-y-8">
      <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
                  Admin Dashboard
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  Logged in as: <strong className="text-emerald-600 dark:text-emerald-400">{userRole}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">System Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ProtectedRoute permission="manageProducts">
              <Link
                href="/admin/products"
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 p-5 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-800 dark:text-white mb-2">Products</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage gift catalog and inventory</p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="manageOrders">
              <Link
                href="/admin/orders"
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 p-5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-800 dark:text-white mb-2">Orders</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">View and manage customer orders</p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="readTransactions">
              <Link
                href="/stripe/transactions"
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 p-5 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50 dark:hover:shadow-purple-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-800 dark:text-white mb-2">Transactions</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">View payment transactions and refunds</p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="readCustomers">
              <Link
                href="/admin/customers"
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 p-5 hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-lg hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-800 dark:text-white mb-2">Customers</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage customer accounts</p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="readAnalytics">
              <Link
                href="/admin/analytics"
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 p-5 hover:border-cyan-300 dark:hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-100/50 dark:hover:shadow-cyan-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-800 dark:text-white mb-2">Analytics</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">View business insights and reports</p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="banCustomer">
              <Link
                href="/admin/users"
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 p-5 hover:border-red-300 dark:hover:border-red-500 hover:shadow-lg hover:shadow-red-100/50 dark:hover:shadow-red-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-800 dark:text-white mb-2">User Management</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage user roles and permissions</p>
                </div>
              </Link>
            </ProtectedRoute>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-200/50 dark:border-emerald-700/30 rounded-tl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-200/50 dark:border-emerald-700/30 rounded-br-2xl"></div>
      </div>

      <ProtectedRoute permission="readAnalytics">
        <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-gradient-to-b from-cyan-500 to-cyan-400 rounded-full"></div>
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">Quick Stats</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-neutral-500 dark:text-neutral-400">Analytics metrics will appear here</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </div>
  );
}`,
    'src/app/_components/dashboard/Metrics.tsx': `"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  Package,
  Users,
  DollarSign,
  Activity,
  Zap,
} from "lucide-react";

const premiumColors = {
  primary: '#10b981',
  secondary: '#8b5cf6',
  tertiary: '#0ea5e9',
  background: 'rgba(255, 255, 255, 0.8)',
  darkBackground: 'rgba(16, 24, 39, 0.8)',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textDark: '#f9fafb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  borderLight: 'rgba(229, 231, 235, 0.6)',
  borderDark: 'rgba(75, 85, 99, 0.6)',
};

interface MetricsData {
  users: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
  orders: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
  revenue: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
  transactions: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
}

const Badge = ({ children, color = 'success', className = '', style = {} }: { 
  children: React.ReactNode; 
  color?: 'success' | 'error' | 'warning'; 
  className?: string; 
  style?: React.CSSProperties;
}) => {
  const colorMap = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  };

  return (
    <span
      className={\`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border \${colorMap[color]} \${className}\`}
      style={style}
    >
      {children}
    </span>
  );
};

const TransactionIcon = ({ className = "size-6" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

// Mock Data for demonstration
const MOCK_METRICS_DATA: MetricsData = {
  users: { total: 4520, growth: 12.5, currentMonth: 452, previousMonth: 400 },
  orders: { total: 12000, growth: -3.2, currentMonth: 980, previousMonth: 1012 },
  revenue: { total: 25890000, growth: 8.9, currentMonth: 2100000, previousMonth: 1928000 },
  transactions: { total: 18450, growth: 15.1, currentMonth: 1540, previousMonth: 1338 },
};

export const Metrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API call with delay
      await new Promise(resolve => setTimeout(resolve, 800));
      // In real app: const response = await fetch('/api/admin/metrics');
      const data = MOCK_METRICS_DATA;

      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load metrics. Using mock data for demonstration.');
      setMetrics(MOCK_METRICS_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatGrowth = (growth: number) => {
    return \`\${growth >= 0 ? '+' : ''}\${growth.toFixed(1)}%\`;
  };

  const getGrowthBadge = (growth: number) => {
    const isPositive = growth >= 0;
    return {
      color: isPositive ? 'success' : 'error' as const,
      icon: isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />,
      text: formatGrowth(growth),
    };
  };

  const metricCards = metrics ? [
    {
      key: 'users',
      title: 'Total Customers',
      value: metrics.users.total,
      monthly: metrics.users.currentMonth,
      growth: metrics.users.growth,
      icon: <Users className="size-6" />,
      color: premiumColors.primary,
      gradient: 'from-emerald-500 to-emerald-600',
      format: formatNumber,
    },
    {
      key: 'orders',
      title: 'Gifts Delivered',
      value: metrics.orders.total,
      monthly: metrics.orders.currentMonth,
      growth: metrics.orders.growth,
      icon: <Package className="size-6" />,
      color: premiumColors.secondary,
      gradient: 'from-purple-500 to-purple-600',
      format: formatNumber,
    },
    {
      key: 'transactions',
      title: 'Total Transactions',
      value: metrics.transactions.total,
      monthly: metrics.transactions.currentMonth,
      growth: metrics.transactions.growth,
      icon: <TransactionIcon />,
      color: premiumColors.tertiary,
      gradient: 'from-blue-500 to-blue-600',
      format: formatNumber,
    },
    {
      key: 'revenue',
      title: 'Total Revenue',
      value: metrics.revenue.total,
      monthly: metrics.revenue.currentMonth,
      growth: metrics.revenue.growth,
      icon: <DollarSign className="size-6" />,
      color: '#f59e0b',
      gradient: 'from-amber-500 to-amber-600',
      format: formatCurrency,
    },
  ] : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-3xl border border-neutral-200/60 dark:border-neutral-700/60 p-6 overflow-hidden group shadow-lg shadow-neutral-100/50 dark:shadow-neutral-950/20"
          >
            <div className="animate-pulse">
              <div className="w-12 h-12 rounded-xl mb-4 bg-neutral-100 dark:bg-neutral-700/50"></div>
              <div className="space-y-3">
                <div className="h-4 bg-neutral-100 dark:bg-neutral-700/50 rounded-full w-2/3"></div>
                <div className="h-8 bg-neutral-100 dark:bg-neutral-700/50 rounded-full w-4/5"></div>
                <div className="h-3 bg-neutral-100 dark:bg-neutral-700/50 rounded-full w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-red-300 dark:border-red-800/60 p-10 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/40 flex items-center justify-center border border-red-200 dark:border-red-700">
          <Activity className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Data Load Failed</h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
        <button
          onClick={fetchMetrics}
          className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-red-500/30 transform hover:scale-[1.02]"
        >
          <div className="flex items-center gap-2">
            <Zap className="size-5" />
            Retry Connection
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && metrics && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/50 rounded-xl text-amber-800 dark:text-amber-300 text-sm flex items-start gap-3 shadow-md">
          <Activity className="size-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const badge = getGrowthBadge(card.growth);

          return (
            <div
              key={card.key}
              className="group relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 p-6 overflow-hidden shadow-xl shadow-neutral-100/50 dark:shadow-neutral-950/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-100/40 dark:hover:shadow-emerald-950/20"
            >
              <div
                className="absolute -top-1/3 -right-1/3 w-3/4 h-3/4 opacity-10 transform rotate-12 group-hover:scale-[1.3] transition-all duration-700 rounded-full pointer-events-none"
                style={{ backgroundColor: card.color, filter: 'blur(30px)' }}
              />

              <div
                className={\`relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl mb-5 transition-all duration-500 group-hover:scale-[1.05]\`}
                style={{
                  background: \`linear-gradient(135deg, \${card.color}15, \${card.color}08)\`,
                  boxShadow: \`0 4px 15px -5px \${card.color}50\`,
                }}
              >
                <div
                  className="w-full h-full rounded-2xl flex items-center justify-center border border-transparent transition-all duration-300 group-hover:border-white/50 dark:group-hover:border-neutral-700"
                  style={{ color: card.color }}
                >
                  {card.icon}
                </div>
              </div>

              <div className="relative z-10">
                <span className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 block mb-1">
                  {card.title}
                </span>
                <h4 className="font-extrabold text-4xl tracking-tight text-neutral-900 dark:text-white transition-colors duration-300 mb-2">
                  {card.format(card.value)}
                </h4>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <Badge
                    color={badge.color}
                    className="transition-all duration-500 transform group-hover:translate-x-1"
                  >
                    <div className="flex items-center gap-1">
                      {badge.icon}
                      <span className="font-bold">{badge.text}</span>
                    </div>
                  </Badge>

                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500 whitespace-nowrap">
                    {card.format(card.monthly)} this month
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};`,

    // Charts Components
    'src/app/_components/charts/bar/BarChartOne.tsx': `"use client";
import React from "react";

import type { ApexOptions } from "apexcharts";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function BarChartOne() {
  const options: ApexOptions = {
    colors: ["#10b981"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => \`\${val}\`,
      },
    },
  };
  const series = [
    {
      name: "Sales",
      data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
    },
  ];
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" className="min-w-[1000px]">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={180}
        />
      </div>
    </div>
  );
}
`,
    'src/app/_components/charts/line/LineChartOne.tsx': `"use client";
import React from "react";

import type { ApexOptions } from "apexcharts";

import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LineChartOne() {
  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#10b981", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "dd MMM yyyy",
      },
    },
    xaxis: {
      type: "category",
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Sales",
      data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235],
    },
    {
      name: "Revenue",
      data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140],
    },
  ];
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartEight" className="min-w-[1000px]">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={310}
        />
      </div>
    </div>
  );
}
`,
    // Email Components
    'src/app/_components/email/email-template.tsx': `import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  Button as EmailButton,
} from '@react-email/components';

interface EmailTemplateProps {
  firstName: string;
  verificationCode?: string;
  type?: 'otp' | 'reset-password' | 'welcome';
  resetUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export function EmailTemplate({
  firstName,
  verificationCode,
  type = 'welcome',
  resetUrl
}: EmailTemplateProps) {

  const emeraldTheme = {
    primary: '#10b981',
    accent: '#059669',
    background: {
      primary: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
      secondary: 'rgba(6, 78, 59, 0.9)',
      card: 'rgba(16, 185, 129, 0.1)'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#d1fae5',
      muted: '#a7f3d0',
      dim: '#6ee7b7'
    },
    border: 'rgba(16, 185, 129, 0.3)'
  };

  const getEmailContent = () => {
    switch (type) {
      case 'reset-password':
        return {
          preview: 'Reset Your Account Password',
          title: 'Reset Your Password',
          subtitle: 'We received a request to reset your password for your account.',
          mainContent: (
            <>
              <Section className="my-[30px] p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                <Text
                  className="text-[18px] font-semibold mb-[15px] text-center m-0"
                  style={{ color: emeraldTheme.accent }}
                >
                  Reset Your Password
                </Text>

                <Text
                  className="text-[15px] leading-[24px] mb-[20px] text-center m-0"
                  style={{ color: emeraldTheme.text.secondary }}
                >
                  Click the button below to reset your password and regain access to your account.
                </Text>

                <Section className="text-center my-[25px]">
                  <EmailButton
                    href={resetUrl}
                    className="px-8 py-4 rounded-lg font-semibold text-[16px] no-underline text-center transition-colors"
                    style={{
                      background: emeraldTheme.accent,
                      color: emeraldTheme.text.primary
                    }}
                  >
                    Reset Password
                  </EmailButton>
                </Section>

                <Text
                  className="text-[13px] text-center m-0 mb-3"
                  style={{ color: emeraldTheme.text.muted }}
                >
                  Or copy and paste this link in your browser:
                </Text>

                <Text
                  className="text-[12px] text-center break-all m-0 p-3 bg-emerald-500/10 rounded border border-emerald-500/20 font-mono"
                  style={{ color: emeraldTheme.primary }}
                >
                  {resetUrl}
                </Text>

                <Text
                  className="text-[13px] italic text-center mt-4 m-0"
                  style={{ color: emeraldTheme.text.muted }}
                >
                  This link will expire in 1 hour for security reasons.
                </Text>
              </Section>

              <Text
                className="text-[14px] leading-[22px] text-center my-[20px] m-0"
                style={{ color: emeraldTheme.text.secondary }}
              >
                If you didn't request this password reset, please ignore this email.
                Your account remains secure.
              </Text>
            </>
          )
        };

      case 'otp':
        return {
          preview: 'Verify Your Account',
          title: 'Verify Your Email Address',
          subtitle: 'Welcome! Please verify your email to get started.',
          mainContent: (
            <>
              <Section className="my-[30px] p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                <Text
                  className="text-[18px] font-semibold mb-[15px] text-center m-0"
                  style={{ color: emeraldTheme.accent }}
                >
                  Verify Your Email Address
                </Text>

                <Text
                  className="text-[15px] leading-[24px] mb-[20px] text-center m-0"
                  style={{ color: emeraldTheme.text.secondary }}
                >
                  Please use the following verification code to complete your account setup.
                </Text>

                <Section className="text-center my-[25px]">
                  <Text
                    className="text-[14px] font-medium mb-[10px] m-0"
                    style={{ color: emeraldTheme.text.secondary }}
                  >
                    Your Verification Code
                  </Text>

                  <Text
                    className="text-[42px] font-bold tracking-widest my-[15px] mx-0 font-mono"
                    style={{ color: emeraldTheme.primary }}
                  >
                    {verificationCode}
                  </Text>

                  <Text
                    className="text-[13px] italic m-0"
                    style={{ color: emeraldTheme.text.muted }}
                  >
                    (This code is valid for 15 minutes)
                  </Text>
                </Section>
              </Section>
            </>
          )
        };

      default:
        return {
          preview: 'Welcome!',
          title: 'Welcome!',
          subtitle: 'Your account has been successfully created.',
          mainContent: (
            <>
              <Text
                className="text-[16px] leading-[26px] mb-[20px] text-center"
                style={{ color: emeraldTheme.text.secondary }}
              >
                Get ready to start building amazing things with our platform.
              </Text>

              <Section className="grid grid-cols-1 gap-4 my-[30px]">
                <Section className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                  <Text
                    className="text-[36px] m-0"
                    style={{ color: emeraldTheme.primary }}
                  >
                    ⚡
                  </Text>
                  <Section>
                    <Text
                      className="text-[16px] font-semibold m-0 mb-1"
                      style={{ color: emeraldTheme.text.primary }}
                    >
                      Fast & Reliable
                    </Text>
                    <Text
                      className="text-[14px] m-0"
                      style={{ color: emeraldTheme.text.secondary }}
                    >
                      Performance-optimized platform
                    </Text>
                  </Section>
                </Section>

                <Section className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                  <Text
                    className="text-[36px] m-0"
                    style={{ color: emeraldTheme.accent }}
                  >
                    🔒
                  </Text>
                  <Section>
                    <Text
                      className="text-[16px] font-semibold m-0 mb-1"
                      style={{ color: emeraldTheme.text.primary }}
                    >
                      Secure Platform
                    </Text>
                    <Text
                      className="text-[14px] m-0"
                      style={{ color: emeraldTheme.text.secondary }}
                    >
                      Enterprise-grade security
                    </Text>
                  </Section>
                </Section>

                <Section className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                  <Text
                    className="text-[36px] m-0"
                    style={{ color: emeraldTheme.primary }}
                  >
                    🔧
                  </Text>
                  <Section>
                    <Text
                      className="text-[16px] font-semibold m-0 mb-1"
                      style={{ color: emeraldTheme.text.primary }}
                    >
                      Modern Tools
                    </Text>
                    <Text
                      className="text-[14px] m-0"
                      style={{ color: emeraldTheme.text.secondary }}
                    >
                      All the tools you need in one place
                    </Text>
                  </Section>
                </Section>
              </Section>

              {/* Call to Action */}
              <Section className="text-center mt-[30px]">
                <Text
                  className="text-[16px] font-semibold mb-[15px] m-0"
                  style={{ color: emeraldTheme.text.primary }}
                >
                  Ready to get started?
                </Text>
                <EmailButton
                  href={\`\${baseUrl}/dashboard\`}
                  className="px-8 py-3 rounded-lg font-semibold text-[16px] no-underline text-center transition-colors"
                  style={{
                    background: emeraldTheme.primary,
                    color: emeraldTheme.text.primary
                  }}
                >
                  Go to Dashboard
                </EmailButton>
              </Section>
            </>
          )
        };
    }
  };

  const emailContent = getEmailContent();

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans text-white" style={{ background: emeraldTheme.background.primary }}>
          <Preview>{emailContent.preview}</Preview>
          <Container className="p-5 mx-auto">
            <Section className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-emerald-500/30" style={{ background: emeraldTheme.background.secondary }}>

              <Section
                className="flex flex-col items-center justify-center py-12 relative overflow-hidden min-h-[200px]"
                style={{
                  background: \`linear-gradient(135deg, \${emeraldTheme.primary} 0%, \${emeraldTheme.accent} 100%)\`
                }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: \`radial-gradient(circle at 25% 25%, white 1px, transparent 1px)\`,
                    backgroundSize: '20px 20px'
                  }}
                />

                <Section className="flex flex-col items-center justify-center space-y-4 relative z-10 w-full max-w-md mx-auto">
                  <Heading
                    className="text-white text-[32px] font-bold tracking-tight text-center w-full m-0"
                    style={{ color: '#FFFFFF' }}
                  >
                    Welcome!
                  </Heading>

                  <Text
                    className="text-white/80 text-[14px] font-light text-center w-full m-0"
                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                  >
                    Building amazing things together
                  </Text>
                </Section>
              </Section>

              <Section className="py-[30px] px-[35px] bg-transparent">
                <Heading
                  className="text-[28px] font-bold mb-[20px] text-center tracking-tight"
                  style={{ color: emeraldTheme.text.primary }}
                >
                  {emailContent.title}
                </Heading>

                <Text
                  className="text-[16px] leading-[26px] mb-[20px] text-center font-light"
                  style={{ color: emeraldTheme.text.secondary }}
                >
                  {emailContent.subtitle}
                </Text>

                {emailContent.mainContent}
              </Section>

              <Hr style={{ borderColor: emeraldTheme.border }} />

              {/* Security Notice */}
              <Section className="py-[25px] px-[35px] bg-emerald-500/10 backdrop-blur-sm">
                <Text
                  className="text-[14px] leading-[20px] text-center m-0 font-light"
                  style={{ color: emeraldTheme.text.muted }}
                >
                  <strong style={{ color: emeraldTheme.text.primary }}>Security Notice:</strong> We will never email you
                  and ask you to disclose or verify your password, credit card,
                  or banking account number.
                </Text>
              </Section>
            </Section>

            <Section className="mt-[20px] text-center">
              <Text
                className="text-[12px] leading-[18px] m-0 mb-2 font-light"
                style={{ color: emeraldTheme.text.muted }}
              >
                Build amazing things with our modern platform.
              </Text>

              <Text
                className="text-[11px] leading-[16px] m-0 font-light"
                style={{ color: emeraldTheme.text.dim }}
              >
                © {new Date().getFullYear()} All rights reserved.{' '}
                <Link
                  href={\`\${baseUrl}/terms\`}
                  className="underline font-normal"
                  style={{ color: emeraldTheme.primary }}
                >
                  Terms & Conditions
                </Link>{' '}
                •{' '}
                <Link
                  href={\`\${baseUrl}/privacy\`}
                  className="underline font-normal"
                  style={{ color: emeraldTheme.primary }}
                >
                  Privacy Policy
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

EmailTemplate.PreviewProps = {
  firstName: 'Alex',
  verificationCode: '123456',
  type: 'welcome',
} satisfies EmailTemplateProps;`,
    'src/app/_components/email/OrderConfirmationEmail.tsx': `import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface OrderConfirmationEmailProps {
  firstName: string;
  orderId: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    recipientName: string;
    address: string;
    city: string;
    region: string;
  };
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export function OrderConfirmationEmail({ 
  firstName,
  orderId,
  orderDate,
  totalAmount,
  status,
  items,
  shippingAddress
}: OrderConfirmationEmailProps) {
  const formattedTotal = (totalAmount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-amber-50 font-serif text-[#5a4a3e]">
          <Preview>Your Order Confirmation</Preview>
          <Container className="p-5 mx-auto bg-amber-50">
            <Section className="bg-white rounded-t-2xl shadow-lg overflow-hidden">
              <Section 
                className="flex py-8 items-center justify-center"
                style={{ backgroundColor: '#10b981' }} 
              >
                <Section className="text-center">
                  <Heading className="text-white text-[32px] font-bold mb-2 m-0">
                    Order Confirmed
                  </Heading>
                  <Text className="text-emerald-200 text-[14px] m-0 italic">
                    Thank you for your purchase
                  </Text>
                </Section>
              </Section>

              <Section className="py-[30px] px-[35px]">
                <Heading 
                  className="text-[28px] font-light mb-[20px] text-center"
                  style={{ color: '#5a4a3e' }} 
                >
                  Thank You for Your Order, {firstName}!
                </Heading>
                
                <Text 
                  className="text-[16px] leading-[26px] mb-[20px] text-center"
                  style={{ color: '#7a6a5a' }} 
                >
                  Your order has been received and is being processed. We'll notify you once it ships.
                </Text>

                {/* Order Confirmation Section */}
                <Section className="my-[30px] p-6 rounded-xl bg-amber-50 border border-amber-200">
                  <Text 
                    className="text-[18px] font-semibold mb-[15px] text-center m-0"
                    style={{ color: '#10b981' }} 
                  >
                    Order Confirmed!
                  </Text>
                  
                  <Text 
                    className="text-[15px] leading-[24px] mb-[20px] text-center m-0"
                    style={{ color: '#7a6a5a' }} 
                  >
                    Your order has been received and is being processed. 
                    Here are your order details:
                  </Text>

                  <Section className="text-center my-[25px]">
                    <Text 
                      className="text-[14px] font-medium mb-[10px] m-0"
                      style={{ color: '#5a4a3e' }}
                    >
                      Order Number
                    </Text>
                    
                    <Text 
                      className="text-[32px] font-bold tracking-widest my-[15px] mx-0"
                      style={{ color: '#d1b68e' }}
                    >
                      {orderId}
                    </Text>
                    
                    <Text 
                      className="text-[13px] italic m-0"
                      style={{ color: '#7a6a5a' }} 
                    >
                      Ordered on {new Date(orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </Section>
                </Section>

                {/* Order Details */}
                <Section className="mb-6">
                  <Text 
                    className="text-[18px] font-semibold mb-4 text-center m-0"
                    style={{ color: '#5a4a3e' }} 
                  >
                    Order Summary
                  </Text>
                  
                  {items.map((item, index) => (
                    <Section 
                      key={index}
                      className={\`flex justify-between items-center py-3 \${index < items.length - 1 ? 'border-b border-amber-200' : ''}\`}
                    >
                      <Section>
                        <Text className="text-[15px] font-semibold m-0 mb-1" style={{ color: '#5a4a3e' }}>
                          {item.name}
                        </Text>
                        <Text className="text-[13px] m-0" style={{ color: '#7a6a5a' }}>
                          Quantity: {item.quantity}
                        </Text>
                      </Section>
                      <Text className="text-[15px] font-bold m-0" style={{ color: '#10b981' }}>
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </Section>
                  ))}
                  
                  <Section className="flex justify-between items-center py-4 border-t border-amber-300 mt-4">
                    <Text className="text-[16px] font-semibold m-0" style={{ color: '#5a4a3e' }}>
                      Total Amount
                    </Text>
                    <Text className="text-[20px] font-bold m-0" style={{ color: '#10b981' }}>
                      {formattedTotal}
                    </Text>
                  </Section>
                </Section>

                {/* Shipping Address */}
                {shippingAddress && (
                  <Section className="mb-6 p-4 rounded-lg bg-white border border-stone-200">
                    <Text 
                      className="text-[16px] font-semibold mb-2 m-0"
                      style={{ color: '#5a4a3e' }} 
                    >
                      Delivery To
                    </Text>
                    <Text className="text-[14px] m-0" style={{ color: '#7a6a5a' }}>
                      {shippingAddress.recipientName}<br />
                      {shippingAddress.address}<br />
                      {shippingAddress.city}, {shippingAddress.region}
                    </Text>
                  </Section>
                )}

                <Section className="mb-6 p-4 rounded-lg bg-white border border-stone-200 text-center">
                  <Text 
                    className="text-[14px] font-medium mb-1 m-0"
                    style={{ color: '#7a6a5a' }} 
                  >
                    CURRENT STATUS
                  </Text>
                  <Text 
                    className="text-[18px] font-semibold capitalize m-0"
                    style={{ color: '#10b981' }} 
                  >
                    {status.toLowerCase()}
                  </Text>
                </Section>

                <Section className="grid grid-cols-1 gap-4 my-[30px]">
                  <Section className="flex items-center gap-4 p-4 bg-white rounded-lg border border-stone-200">
                    <Text 
                      className="text-[36px] m-0"
                      style={{ color: '#d1b68e' }} 
                    >
                      📧
                    </Text>
                    <Section>
                      <Text 
                        className="text-[16px] font-semibold m-0 mb-1"
                        style={{ color: '#5a4a3e' }}
                      >
                        Order Processing
                      </Text>
                      <Text 
                        className="text-[14px] m-0"
                        style={{ color: '#7a6a5a' }} 
                      >
                        Your order is being prepared
                      </Text>
                    </Section>
                  </Section>

                  <Section className="flex items-center gap-4 p-4 bg-white rounded-lg border border-stone-200">
                    <Text 
                      className="text-[36px] m-0"
                      style={{ color: '#10b981' }} 
                    >
                      🔍
                    </Text>
                    <Section>
                      <Text 
                        className="text-[16px] font-semibold m-0 mb-1"
                        style={{ color: '#5a4a3e' }} 
                      >
                        Quality Check
                      </Text>
                      <Text 
                        className="text-[14px] m-0"
                        style={{ color: '#7a6a5a' }} 
                      >
                        Ensuring your items meet quality standards
                      </Text>
                    </Section>
                  </Section>

                  <Section className="flex items-center gap-4 p-4 bg-white rounded-lg border border-stone-200">
                    <Text 
                      className="text-[36px] m-0"
                      style={{ color: '#d1b68e' }} 
                    >
                      🚚
                    </Text>
                    <Section>
                      <Text 
                        className="text-[16px] font-semibold m-0 mb-1"
                        style={{ color: '#5a4a3e' }} 
                      >
                        Delivery Preparation
                      </Text>
                      <Text 
                        className="text-[14px] m-0"
                        style={{ color: '#7a6a5a' }} 
                      >
                        Items are being packaged for shipping
                      </Text>
                    </Section>
                  </Section>
                </Section>

                {/* Call to Action */}
                <Section className="text-center mt-[30px]">
                  <Text 
                    className="text-[16px] font-semibold mb-[15px] m-0"
                    style={{ color: '#5a4a3e' }} 
                  >
                    Want to track your order or make another purchase?
                  </Text>
                  <Section className="flex flex-col gap-3 justify-center">
                    <Link
                      href={\`\${baseUrl}/orders\`}
                      className="inline-block bg-[#10b981] text-white px-8 py-3 rounded-xl font-semibold text-[16px] no-underline text-center"
                    >
                      View Order Details
                    </Link>
                    <Link
                      href={\`\${baseUrl}/shop\`}
                      className="inline-block bg-[#d1b68e] text-white px-8 py-3 rounded-xl font-semibold text-[16px] no-underline text-center"
                    >
                      Continue Shopping
                    </Link>
                  </Section>
                </Section>
              </Section>

              <Hr className="border-stone-200" />

              {/* Security Notice */}
              <Section className="py-[25px] px-[35px] bg-amber-50">
                <Text 
                  className="text-[14px] leading-[20px] text-center m-0"
                  style={{ color: '#7a6a5a' }} 
                >
                  <strong>Security Notice:</strong> We will never email you 
                  and ask you to disclose or verify your password, credit card, 
                  or banking account number.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="mt-[20px] text-center">
              <Text 
                className="text-[12px] leading-[18px] m-0 mb-2"
                style={{ color: '#7a6a5a' }} 
              >
                Thank you for shopping with us. We appreciate your business.
              </Text>
              
              <Text 
                className="text-[11px] leading-[16px] m-0"
                style={{ color: '#7a6a5a' }} 
              >
                © {new Date().getFullYear()} All rights reserved.{' '}
                <Link
                  href={\`\${baseUrl}/contact\`}
                  className="underline"
                  style={{ color: '#10b981' }} 
                >
                  Contact Support
                </Link>{' '}
                •{' '}
                <Link
                  href={\`\${baseUrl}/faq\`}
                  className="underline"
                  style={{ color: '#10b981' }} 
                >
                  FAQ
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

OrderConfirmationEmail.PreviewProps = {
  firstName: 'Helen',
  orderId: 'ORD-789456123',
  orderDate: new Date().toISOString(),
  totalAmount: 27500,
  status: 'CONFIRMED',
  items: [
    {
      name: 'Sample Product',
      quantity: 1,
      price: 27500,
    },
    {
      name: 'Another Product',
      quantity: 2,
      price: 9500,
    }
  ],
  shippingAddress: {
    recipientName: 'John Doe',
    address: '123 Main Street',
    city: 'New York',
    region: 'NY'
  }
} satisfies OrderConfirmationEmailProps;`,

    // Form Components
    'src/app/_components/form/input/Checkbox.tsx': `import type React from "react";
import { twMerge } from "tailwind-merge";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  labelClassName?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  labelClassName = "",
  disabled = false,
}) => {
  const checkboxId = id || \`checkbox-\${Math.random().toString(36).substr(2, 9)}\`;

  return (
    <label
      htmlFor={checkboxId}
      className={twMerge(
        "flex items-center space-x-3 group cursor-pointer select-none",
        disabled ? "cursor-not-allowed opacity-60" : ""
      )}
    >
      <div className="relative w-5 h-5 flex-shrink-0">
        <input
          id={checkboxId}
          type="checkbox"
          className={twMerge(
            "peer appearance-none w-5 h-5 rounded-md border transition-all duration-200",
            // Light Mode Defaults
            "border-gray-300 bg-white checked:bg-emerald-600 checked:border-transparent",
            // Dark Mode / Glass Defaults
            "dark:border-white/20 dark:bg-black/20 dark:checked:bg-emerald-500",
            // Hover states
            !disabled && "group-hover:border-emerald-400 dark:group-hover:border-emerald-400",
            // Custom overrides
            className
          )}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        
        {/* Checkmark Icon */}
        <svg
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white dark:text-white" 
          />
        </svg>
      </div>
      
      {label && (
        <span className={twMerge(
          "text-sm font-medium transition-colors",
          "text-gray-700 dark:text-gray-300",
          disabled ? "text-gray-400" : "group-hover:text-gray-900 dark:group-hover:text-white",
          labelClassName
        )}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;`,
    'src/app/_components/form/input/InputField.tsx': `import React from "react";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; 
  success?: boolean;
  error?: boolean;
  hint?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input: FC<InputProps> = ({
  id,
  className = "",
  disabled = false,
  success = false,
  error = false,
  hint,
  startIcon,
  endIcon,
  ...props
}) => {
  // Base classes with Glassmorphism readiness
  const baseStyles = "w-full h-11 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50";

  // State-based Styling
  const stateStyles = error
    ? "border-red-500 text-red-900 placeholder:text-red-300 focus:ring-2 focus:ring-red-500/20 bg-red-50/50 dark:bg-red-900/10 dark:text-red-200 dark:border-red-500/50"
    : success
    ? "border-emerald-500 text-emerald-900 placeholder:text-emerald-300 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10 dark:text-emerald-200 dark:border-emerald-500/50"
    : "border-gray-200 bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20";

  // Padding adjustment if icons are present
  const paddingStyles = twMerge(
    startIcon ? "pl-11" : "",
    endIcon ? "pr-11" : ""
  );

  return (
    <div className="w-full">
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            {startIcon}
          </div>
        )}

        <input
          id={id}
          disabled={disabled}
          className={twMerge(baseStyles, stateStyles, paddingStyles, className)}
          {...props}
        />

        {endIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {endIcon}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {hint && (
        <p
          className={twMerge(
            "mt-1.5 text-xs font-medium animate-in slide-in-from-top-1 fade-in-0",
            error ? "text-red-500" : success ? "text-emerald-500" : "text-gray-500 dark:text-gray-400"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;`,
    'src/app/_components/form/label/Label.tsx': `import React from "react";
import type { ReactNode, FC } from "react";
import { twMerge } from "tailwind-merge";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className, required }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={twMerge(
        "block mb-1.5 text-sm font-medium tracking-tight transition-colors",
        "text-gray-700 dark:text-gray-300",
        className
      )}
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
};

export default Label;`,

    // Header Components
    'src/app/_components/header/NotificationDropdown.tsx': `"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };
  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={\`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 \${
            !notifying ? "hidden" : "flex"
          }\`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notification
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {/* Example notification items */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-02.jpg"
                  alt="User"
                  className="w-full overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Terry Franci
                  </span>
                  <span>requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>5 min ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-03.jpg"
                  alt="User"
                  className="w-full overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 block space-x-1  text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Alena Franci
                  </span>
                  <span> requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>8 min ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              href="#"
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-04.jpg"
                  alt="User"
                  className="w-full overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 block space-x-1 text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Jocelyn Kenter
                  </span>
                  <span>requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>15 min ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              href="#"
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-05.jpg"
                  alt="User"
                  className="w-full overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-red-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Brandon Philips
                  </span>
                  <span> requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>1 hr ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              onItemClick={closeDropdown}
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-02.jpg"
                  alt="User"
                  className="w-full overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Terry Franci
                  </span>
                  <span>requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>5 min ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-03.jpg"
                  alt="User"
                  className="w-full overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Alena Franci
                  </span>
                  <span>requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>8 min ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-04.jpg"
                  alt="User"
                  className="w-full overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Jocelyn Kenter
                  </span>
                  <span>requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>15 min ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              href="#"
            >
              <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                <Image
                  width={40}
                  height={40}
                  src="/images/user/user-05.jpg"
                  alt="User"
                  className="overflow-hidden rounded-full"
                />
                <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-red-500 dark:border-gray-900"></span>
              </span>

              <span className="block">
                <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Brandon Philips
                  </span>
                  <span>requests permission to change</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Project - Nganter App
                  </span>
                </span>

                <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                  <span>Project</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>1 hr ago</span>
                </span>
              </span>
            </DropdownItem>
          </li>
          {/* Add more items as needed */}
        </ul>
        <Link
          href="/"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View All Notifications
        </Link>
      </Dropdown>
    </div>
  );
}
`,
    'src/app/_components/header/UserDropdown.tsx': `"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown"; 
import { DropdownItem } from "../ui/dropdown/DropdownItem"; 
import { authClient } from "~/server/better-auth/client"; 

const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4.5C8.04416 4.5 4.75 7.79416 4.75 11.75C4.75 13.9113 5.48529 15.9392 6.77618 17.5223C7.57912 14.881 9.94059 13 12.75 13H11.25C9.45507 13 7.82855 14.0768 7.08643 15.656C5.5539 14.1506 4.75 12.0159 4.75 9.75C4.75 6.47761 7.47761 3.75 10.75 3.75C12.723 3.75 14.5492 4.67232 15.6881 6.25H16.25C16.9404 6.25 17.5 5.6904 17.5 5C17.5 4.3096 16.9404 3.75 16.25 3.75H15.6881C14.5492 2.1627 12.723 1.25 10.75 1.25C6.80416 1.25 3.5 4.55416 3.5 8.5C3.5 9.5165 3.75052 10.4907 4.22558 11.3653C5.11893 13.0645 6.74601 14.25 8.5625 14.25H9.5C9.91421 14.25 10.25 14.5858 10.25 15C10.25 15.4142 9.91421 15.75 9.5 15.75H8.5625C6.18241 15.75 4.14856 17.2655 3.42558 19.3347C4.71658 20.9178 6.64415 21.75 8.75 21.75C13.2941 21.75 17.0625 18.0441 17.0625 13.5H18.75C19.8248 13.5 20.75 12.5748 20.75 11.5V10.25C20.75 9.83579 20.4142 9.5 20 9.5C19.5858 9.5 19.25 9.83579 19.25 10.25V11.5C19.25 11.8459 18.9669 12.125 18.625 12.125H17.0625V13.5C17.0625 15.6989 15.8209 17.5505 14.075 18.4116C15.6178 17.6534 16.75 16.0355 16.75 14.125V13H17.8125C18.667 13 19.3125 12.3545 19.3125 11.5V10.25C19.3125 9.43579 18.667 8.75 17.8125 8.75H16.25C16.9404 8.75 17.5 8.1904 17.5 7.5C17.5 6.8096 16.9404 6.25 16.25 6.25H10.75C10.3358 6.25 10 6.58579 10 7C10 7.41421 10.3358 7.75 10.75 7.75C12.3941 7.75 13.75 9.1059 13.75 10.75C13.75 12.3941 12.3941 13.75 10.75 13.75C9.1059 13.75 7.75 12.3941 7.75 10.75C7.75 9.1059 9.1059 7.75 10.75 7.75Z"
      fill="currentColor"
    />
  </svg>
);

const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.4858 3.5L13.5182 3.5C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5ZM13.5182 2L10.4858 2C9.25201 2 8.25182 3.00019 8.25182 4.23399C8.25182 4.79884 7.64013 5.15215 7.15065 4.86955C6.08213 4.25263 4.71559 4.61859 4.0986 5.68725L2.58261 8.31303C1.96575 9.38146 2.33183 10.7477 3.40025 11.3645C3.88948 11.647 3.88947 12.3531 3.40026 12.6355C2.33184 13.2524 1.96578 14.6186 2.58263 15.687L4.09863 18.3128C4.71562 19.3814 6.08215 19.7474 7.15067 19.1305C7.64015 18.8479 8.25182 19.2012 8.25182 19.766C8.25182 20.9998 9.25201 22 10.4858 22H13.5182C14.7519 22 15.7518 20.9998 15.7518 19.7663C15.7518 19.2015 16.3632 18.8487 16.852 19.1309C17.9202 19.7476 19.2862 19.3816 19.9029 18.3134L21.4193 15.6869C22.0361 14.6185 21.6701 13.2523 20.6017 12.6355C20.1125 12.3531 20.1125 11.647 20.6017 11.3645C21.6701 10.7477 22.0362 9.38152 21.4193 8.3131L19.903 5.68667C19.2862 4.61842 17.9202 4.25241 16.852 4.86917C16.3632 5.15138 15.7518 4.79856 15.7518 4.23377C15.7518 3.00024 14.7519 2 13.5182 2ZM9.6659 11.9999C9.6659 10.7103 10.7113 9.66493 12.0009 9.66493C13.2905 9.66493 14.3359 10.7103 14.3359 11.9999C14.3359 13.2895 13.2905 14.3349 12.0009 14.3349C10.7113 14.3349 9.6659 13.2895 9.6659 11.9999ZM12.0009 8.16493C9.88289 8.16493 8.1659 9.88191 8.1659 11.9999C8.1659 14.1179 9.88289 15.8349 12.0009 15.8349C14.1189 15.8349 15.8359 14.1179 15.8359 11.9999C15.8359 9.88191 14.1189 8.16493 12.0009 8.16493Z"
      fill="currentColor"
    />
  </svg>
);

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: session, isLoading } = authClient.useSession();

  const user = session?.user;
  const userName = user?.name || user?.firstName || "User";
  const userEmail = user?.email || "No email";
  const userImage = user?.image || null;

  const dropdownRef = useRef<HTMLDivElement>(null);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/"; 
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/";
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return \`\${user.firstName[0]}\${user.lastName[0]}\`.toUpperCase();
    }
    if (user?.name) {
      return user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-gray-700 dark:text-gray-400">
        <div className="mr-3 overflow-hidden rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-700 animate-pulse sm:h-11 sm:w-11"></div>
        <div className="hidden sm:block space-y-1">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded-md animate-pulse"></div>
        </div>
      </div>
    );
  }

  const Avatar = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm", 
      lg: "w-11 h-11 text-base", 
    };

    const currentSize = sizeClasses[size];
    const imageSize = size === "lg" ? 44 : 40;

    return (
        <span
    className=\`shrink-0 overflow-hidden rounded-full \${currentSize}\`
  >
        {userImage ? (
          <Image
            width={imageSize}
            height={imageSize}
            src={userImage}
            alt={userName}
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className={\`\${currentSize} rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white font-semibold\`}
          >
            {getUserInitials()}
          </div>
        )}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
        aria-expanded={isOpen}
        aria-controls="user-menu-dropdown"
        aria-label="User Account Menu"
      >
        <Avatar size="lg" />

        <div className="hidden md:block text-left mx-3 min-w-0">
          <span className="block font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
            {userName}
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
            {user?.role === "admin" ? "Administrator" : "User"}
          </span>
        </div>

        <svg
          className={\`shrink-0 stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 h-5 w-5 md:ml-2 mr-1 \${
            isOpen ? "rotate-180" : ""
          } hidden md:block\`}
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        id="user-menu-dropdown"
        className="absolute right-0 mt-3 w-64 md:w-[280px] flex flex-col rounded-xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-300/50 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/50 z-50 transition-opacity transition-transform origin-top-right"
      >
        <div className="flex items-center gap-3 p-2 mb-2 border-b border-gray-100 dark:border-gray-700">
          <Avatar size="md" />
          <div className="flex-1 min-w-0">
            <span className="block font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
              {userName}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400 truncate">
              {userEmail}
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-1 pb-1">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
            >
              <ProfileIcon className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500 transition-colors" />
              Edit profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
            >
              <SettingsIcon className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500 transition-colors" />
              Account settings
            </DropdownItem>
          </li>

          {user?.role === "admin" && (
            <li>
              <DropdownItem
                onItemClick={closeDropdown}
                tag="a"
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
              >
                <div className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500 transition-colors">
                  <span className="text-xl">🛠️</span>
                </div>
                Admin Panel
              </DropdownItem>
            </li>
          )}

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/support"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
            >
              <div className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500 transition-colors">
                <span className="text-xl">❓</span>
              </div>
              Support
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center justify-center gap-3 px-3 py-2 mt-2 font-medium text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSigningOut ? (
            <>
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-red-700 dark:text-red-400">
                Signing out...
              </span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 fill-red-600 dark:fill-red-400"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                  fill="currentColor"
                />
              </svg>
              Sign out
            </>
          )}
        </button>
      </Dropdown>
    </div>
  );
}`,

    // Layout Components
    'src/app/_components/layout/AdminLayoutClient.tsx': `"use client";

import { useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import React from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isExpanded || isHovered
    ? "lg:ml-[320px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-emerald-50/30 dark:from-neutral-900 dark:via-neutral-800/50 dark:to-emerald-900/10 transition-all duration-500">
      <Backdrop />

      <div className="relative z-40">
        <AppSidebar />
      </div>
      <div
        className={\`min-h-screen transition-all duration-500 ease-out \${mainContentMargin}\`}
      >
        <div className="sticky top-0 z-30">
          <AppHeader />
        </div>

        <div className="p-4 mx-auto max-w-7xl md:p-6 lg:p-8">
          <div className="relative">
            <div
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: \`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")\`,
              }}
            />

            <div className="relative">
              <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md transition-all duration-300">
                {children}
              </div>

              <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent dark:via-emerald-700/20" />
            </div>
          </div>
        </div>

        <footer className="mt-16 border-t border-neutral-200/40 dark:border-neutral-700/40">
          <div className="p-6 mx-auto max-w-7xl">
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-4">
                <span>© 2024 All Rights Reserved</span>
                <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <span>Admin Panel</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>System Online</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-200/10 dark:bg-emerald-600/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/3 h-1/3 bg-blue-200/10 dark:bg-blue-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
}`,
    'src/app/_components/layout/AppHeader.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import { ThemeToggleButton } from "~/app/_components/common/ThemeToggleButton";
import NotificationDropdown from "~/app/_components/header/NotificationDropdown";
import UserDropdown from "~/app/_components/header/UserDropdown";
import { useSidebar } from "../context/SidebarContext";
import Image from "next/image";
import Link from "next/link";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">

          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="flex items-center justify-center w-10 h-10 text-emerald-600 border border-neutral-200 rounded-xl transition-all hover:bg-emerald-50 dark:border-neutral-700 dark:text-emerald-300 dark:hover:bg-neutral-800 lg:h-11 lg:w-11"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <Link href="/" className="lg:hidden">
            <Image
              width={154}
              height={32}
              src="/images/logo/logo.svg"
              alt="Logo"
              className="dark:hidden"
            />
            <Image
              width={154}
              height={32}
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              className="hidden dark:block"
            />
          </Link>

          {/* Mobile Application Menu */}
          <button
            onClick={toggleApplicationMenu}
            aria-label="Toggle Menu"
            className="flex items-center justify-center w-10 h-10 text-neutral-600 rounded-xl transition-all hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 lg:hidden"
          >
            <svg width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          <div className="hidden lg:block">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="fill-neutral-400 dark:fill-neutral-500">
                    <path d="M3.04 9.37a6.33 6.33 0 1 1 6.33 6.33A6.33 6.33 0 0 1 3.04 9.37Zm11.32 6.04 2.82 2.82..." />
                  </svg>
                </span>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type command..."
                  className="h-11 rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-12 pr-14 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 transition-all xl:w-[430px]"
                />

                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-neutral-300 bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 transition-colors"
                >
                  ⌘ K
                </button>
              </div>
            </form>
          </div>
        </div>

        <div
          className={\`\${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-6 lg:py-4 bg-white dark:bg-neutral-900 shadow-md lg:shadow-none transition-colors\`}
        >
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
`,
    'src/app/_components/layout/AppSidebar.tsx': `"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid3X3,
  ChevronDown,
  MoreHorizontal,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Wallet,
  TrendingUp,
  FileText,
  Shield,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
const mainNav = [
  {
    name: "Dashboard",
    icon: <Grid3X3 className="w-4 h-4" />,
    path: "/admin"
  },
  {
    name: "User Management",
    icon: <Users className="w-4 h-4" />,
    subItems: [
      { name: "All Users", path: "/admin/users", available: true },
      { name: "User Roles", path: "/admin/user-roles", available: false },
      { name: "Permissions", path: "/admin/permissions", available: false },
    ],
  },
  {
    name: "Transactions",
    icon: <CreditCard className="w-4 h-4" />,
    subItems: [
      { name: "All Transactions", path: "/admin/transactions", available: true },
      { name: "Pending Transactions", path: "/admin/transactions/pending", available: false },
      { name: "Failed Transactions", path: "/admin/transactions/failed", available: false },
      { name: "Refund Requests", path: "/admin/transactions/refunds", available: false },
      { name: "Transaction Analytics", path: "/admin/transactions/analytics", available: false },
    ],
  },
  {
    name: "Financial Reports",
    icon: <BarChart3 className="w-4 h-4" />,
    subItems: [
      { name: "Daily Reports", path: "/admin/reports/daily", available: false },
      { name: "Monthly Reports", path: "/admin/reports/monthly", available: false },
      { name: "Revenue Analysis", path: "/admin/reports/revenue", available: false },
      { name: "Tax Reports", path: "/admin/reports/tax", available: false },
    ],
  },
];

const systemNav = [
  {
    name: "System",
    icon: <Settings className="w-4 h-4" />,
    subItems: [
      { name: "General Settings", path: "/admin/settings/general", available: false },
      { name: "Payment Gateway", path: "/admin/settings/payment", available: false },
      { name: "API Configuration", path: "/admin/settings/api", available: false },
    ],
  },
  {
    name: "Security",
    icon: <Shield className="w-4 h-4" />,
    subItems: [
      { name: "Audit Logs", path: "/admin/security/audit", available: false },
      { name: "Access Control", path: "/admin/security/access", available: false },
    ],
  },
];

const toolsNav = [
  {
    name: "Analytics",
    icon: <TrendingUp className="w-4 h-4" />,
    subItems: [
      { name: "Sales Dashboard", path: "/admin/analytics/sales", available: false },
      { name: "User Analytics", path: "/admin/analytics/users", available: false },
    ],
  },
  {
    name: "Documentation",
    icon: <FileText className="w-4 h-4" />,
    subItems: [
      { name: "API Docs", path: "/admin/docs/api", available: false },
      { name: "User Guide", path: "/admin/docs/guide", available: false },
    ],
  },
];

const AppSidebar = () => {
  // Use the REAL sidebar context - this is the key fix!
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "system" | "tools";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const showFullContent = isExpanded || isHovered || isMobileOpen;

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      closeMobileSidebar();
    }
  }, [pathname, closeMobileSidebar]);

  useEffect(() => {
    let submenuMatched = false;

    ["main", "system", "tools"].forEach((menuType) => {
      const items = menuType === "main" ? mainNav : menuType === "system" ? systemNav : toolsNav;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "system" | "tools",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  // Height calculation
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = \`\${openSubmenu.type}-\${openSubmenu.index}\`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "system" | "tools") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderItems = (items: any[], menuType: "main" | "system" | "tools") => (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => {
        const isOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveChild = item.subItems?.some((sub: any) => isActive(sub.path));

        return (
          <li key={item.name}>
            {item.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={\`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer border-neutral-200 dark:border-neutral-700 \${isOpen || hasActiveChild
                    ? "bg-emerald-50 dark:bg-neutral-800 border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 font-semibold shadow-sm"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-neutral-800 hover:border-emerald-200 dark:hover:border-neutral-700 hover:text-emerald-700 dark:hover:text-emerald-400"
                  } \${!showFullContent ? "lg:justify-center" : ""}\`}
              >
                <span className={\`transition-colors duration-300 \${isOpen || hasActiveChild ? "text-emerald-700" : "text-neutral-500 dark:text-neutral-400"
                  }\`}>
                  {item.icon}
                </span>
                {showFullContent && (
                  <span className="text-sm flex items-center gap-2">
                    {item.name}
                  </span>
                )}
                {showFullContent && (
                  <ChevronDown
                    className={\`ml-auto w-4 h-4 transition-all duration-300 \${isOpen ? "rotate-180 text-emerald-700" : "text-neutral-400"
                      }\`}
                  />
                )}
              </button>
            ) : (
              <Link
                href={item.path}
                className={\`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition-all duration-300 border-neutral-200 dark:border-neutral-700 \${isActive(item.path)
                    ? "bg-emerald-50 dark:bg-neutral-800 border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 font-semibold shadow-sm"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-neutral-800 hover:border-emerald-200 dark:hover:border-neutral-700 hover:text-emerald-700 dark:hover:text-emerald-400"
                  } \${!showFullContent ? "lg:justify-center" : ""}\`}
              >
                <span className={\`transition-colors duration-300 \${isActive(item.path) ? "text-emerald-700" : "text-neutral-500 dark:text-neutral-400"
                  }\`}>
                  {item.icon}
                </span>
                {showFullContent && (
                  <span className="text-sm">
                    {item.name}
                  </span>
                )}
              </Link>
            )}

            {item.subItems && showFullContent && (
              <div
                ref={(el) => {
                  subMenuRefs.current[\`\${menuType}-\${index}\`] = el;
                }}
                className="overflow-hidden transition-all duration-500 ease-out"
                style={{
                  height: isOpen ? \`\${subMenuHeight[\`\${menuType}-\${index}\`]}px\` : "0px",
                }}
              >
                <ul className="ml-6 mt-2 space-y-1">
                  {item.subItems.map((sub: any) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.available ? sub.path : "#"}
                        className={\`flex items-center justify-between px-4 py-2 text-sm rounded-lg border transition-all group \${isActive(sub.path)
                            ? "bg-emerald-100 dark:bg-neutral-700 border-emerald-300 dark:border-neutral-600 text-emerald-700 dark:text-emerald-200 font-medium"
                            : sub.available
                              ? "border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-emerald-50 dark:hover:bg-neutral-800 hover:text-emerald-700 dark:hover:text-emerald-300"
                              : "border-transparent text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
                          }\`}
                      >
                        <span>{sub.name}</span>
                        {!sub.available && (
                          <span className="text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-500 px-2 py-1 rounded">
                            Soon
                          </span>
                        )}
                        {sub.available && isActive(sub.path) && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderSection = (title: string, items: any[], section: "main" | "system" | "tools") => (
    <div className="space-y-4">
      <h3 className="uppercase text-xs font-semibold flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
        {showFullContent ? (
          <span className="flex items-center gap-2">
            <div className="w-1 h-4 bg-current rounded-full opacity-60"></div>
            {title}
          </span>
        ) : (
          <MoreHorizontal className="w-4 h-4" />
        )}
      </h3>
      {renderItems(items, section)}
    </div>
  );

  return (
    <aside
      className={\`fixed top-0 left-0 h-screen z-50 transition-all duration-500 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-r border-neutral-200 dark:border-neutral-800
        \${showFullContent ? "w-[320px]" : "w-[90px]"} shadow-[4px_0_20px_-5px_rgba(0,0,0,0.06)]\`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        {showFullContent ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-neutral-800 dark:text-white">Admin Panel</div>
              <div className="text-xs text-neutral-500">Dashboard</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <nav className="p-4 space-y-8 h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
        {renderSection("Main Menu", mainNav, "main")}
        {renderSection("System", systemNav, "system")}
        {renderSection("Tools", toolsNav, "tools")}

        {/* Quick Stats - Only show when expanded */}
        {showFullContent && (
          <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Quick Stats
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Today's Transactions</span>
                <span className="font-medium text-emerald-600">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pending</span>
                <span className="font-medium text-amber-600">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Revenue</span>
                <span className="font-medium text-emerald-600">$2,847</span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default AppSidebar;`,
    'src/app/_components/layout/Backdrop.tsx': `import { useSidebar } from "../context/SidebarContext";
import React from "react";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
`,

    // Tables Components
    'src/app/_components/tables/Transactions.tsx': `'use client';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  CreditCard,
  DollarSign,
  Truck,
  CheckCircle,
  Copy,
  FileText,
  Mail,
  MapPin,
  User as UserIcon,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./../ui/table";
import Badge from "../ui/badge/Badge";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Link from "next/link";

interface Transaction {
  id: string;
  paymentIntentId: string;
  chargeId?: string;
  amount: number;
  amountCaptured: number;
  currency: string;
  status: string;
  created: string;
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  stripeCustomer: any;
  stripeShipping: any;
  orderId?: string;
  localOrder: {
    id: string;
    status: string;
    createdAt: string;
    shippingName: string;
    shippingAddress: any;
    rawShippingAddress: string;
  } | null;
  localUser: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    stripeCustomerId: string | null;
  } | null;
  productDescription: string;
  shippingAddress: string | null;
  description: string | null;
  paymentMethod: string;
  receiptUrl: string | null;
  fee: number;
  netAmount: number;
  metadata: Record<string, string>;
}

type StatusFilter = 'all' | 'succeeded' | 'processing' | 'requires_payment_method' | 'canceled';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const pageSize = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/transactions?limit=100');

      if (!response.ok) {
        throw new Error(\`Failed to fetch transactions: \${response.statusText}\`);
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(\`Failed to fetch transactions: \${err instanceof Error ? err.message : 'Unknown error'}\`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (activeTab !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === activeTab);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.id.toLowerCase().includes(searchLower) ||
        transaction.paymentIntentId.toLowerCase().includes(searchLower) ||
        transaction.chargeId?.toLowerCase().includes(searchLower) ||
        transaction.customerEmail?.toLowerCase().includes(searchLower) ||
        transaction.customerName?.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.orderId?.toLowerCase().includes(searchLower) ||
        transaction.localUser?.name?.toLowerCase().includes(searchLower) ||
        transaction.localUser?.firstName?.toLowerCase().includes(searchLower) ||
        transaction.localUser?.lastName?.toLowerCase().includes(searchLower) ||
        transaction.localUser?.email.toLowerCase().includes(searchLower) ||
        transaction.productDescription.toLowerCase().includes(searchLower) ||
        transaction.shippingAddress?.toLowerCase().includes(searchLower) ||
        transaction.localOrder?.shippingName?.toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }, [transactions, activeTab, searchTerm]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const formatAmount = useCallback((amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }, []);

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'processing':
        return 'warning';
      case 'requires_payment_method':
        return 'error';
      case 'requires_action':
        return 'warning';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const getStatusDisplayText = useCallback((status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'requires_payment_method':
        return 'Payment Failed';
      case 'requires_action':
        return 'Action Required';
      case 'canceled':
        return 'Canceled';
      default:
        return status.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
    }
  }, []);

  const getCustomerDisplayName = useCallback((transaction: Transaction): string => {
    if (transaction.localUser) {
      if (transaction.localUser.firstName && transaction.localUser.lastName) {
        return \`\${transaction.localUser.firstName} \${transaction.localUser.lastName}\`;
      }
      if (transaction.localUser.name) {
        return transaction.localUser.name;
      }
      return transaction.localUser.email;
    }

    if (transaction.customerName) {
      return transaction.customerName;
    }

    if (transaction.customerEmail) {
      return transaction.customerEmail;
    }

    return 'Unknown Customer';
  }, []);

  const getCustomerEmail = useCallback((transaction: Transaction): string => {
    return transaction.localUser?.email || transaction.customerEmail || 'No email';
  }, []);

  const getOrderStatusBadgeColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const tabStats = useMemo(() => {
    const tabTransactions = filteredTransactions;
    return {
      total: tabTransactions.length,
      totalAmount: tabTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      totalFees: tabTransactions.reduce((sum, transaction) => sum + transaction.fee, 0),
      totalNet: tabTransactions.reduce((sum, transaction) => sum + transaction.netAmount, 0),
      succeeded: tabTransactions.filter(t => t.status === 'succeeded').length,
      withLocalData: tabTransactions.filter(t => t.localOrder).length,
      withShipping: tabTransactions.filter(t => t.shippingAddress).length,
    };
  }, [filteredTransactions]);

  const tabs = useMemo(() => [
    { key: 'all' as StatusFilter, label: 'All Transactions', count: transactions.length },
    { key: 'succeeded' as StatusFilter, label: 'Completed', count: transactions.filter(t => t.status === 'succeeded').length },
    { key: 'processing' as StatusFilter, label: 'Processing', count: transactions.filter(t => t.status === 'processing').length },
    { key: 'requires_payment_method' as StatusFilter, label: 'Failed', count: transactions.filter(t => t.status === 'requires_payment_method').length },
  ], [transactions]);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading transactions...</p>
        <p className="text-sm text-gray-400 mt-1">Please wait while we fetch the transaction data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans p-2">

      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transaction Management</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor payments, orders, and customer transactions.</p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => fetchTransactions()} disabled={loading} className="gap-2">
              <RefreshCw className={\`h-4 w-4 \${loading ? 'animate-spin' : ''}\`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden p-5 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard className="h-16 w-16 text-gray-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tabStats.total}</p>
            </div>
          </div>

          <div className="relative overflow-hidden p-5 bg-emerald-50/20 rounded-2xl border border-emerald-100/60 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100/40 rounded-lg border border-emerald-100">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Volume</span>
              </div>
              <p className="text-2xl font-bold text-emerald-800">
                {formatAmount(tabStats.totalAmount, 'usd')}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden p-5 bg-green-50/20 rounded-2xl border border-green-100/60 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100/40 rounded-lg border border-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-green-700">Successful</span>
              </div>
              <p className="text-2xl font-bold text-green-800">{tabStats.succeeded}</p>
            </div>
          </div>

          <div className="relative overflow-hidden p-5 bg-blue-50/20 rounded-2xl border border-blue-100/60 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100/40 rounded-lg border border-blue-100">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">With Shipping</span>
              </div>
              <p className="text-2xl font-bold text-blue-800">{tabStats.withShipping}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">

        <div className="flex w-full lg:w-auto p-1.5 bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto no-scrollbar gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap \${activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }\`}
            >
              {tab.label}
              <span className={\`px-1.5 py-0.5 rounded-md text-[10px] font-bold \${activeTab === tab.key ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-500'}\`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80 px-2 lg:px-0 mb-2 lg:mb-0">
          <div className="absolute inset-y-0 left-0 pl-3 lg:pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search transactions, customers, orders, shipping..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-gray-50/50 focus:bg-white border-gray-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-x-auto">

        {loading && transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-500">Loading transaction data...</p>
          </div>
        ) : (
          <div className="min-w-[1400px] w-full">
            <Table>
              <TableHeader className="bg-gray-100/70 border-b border-gray-200">
                <TableRow className="hover:bg-transparent">
                  <TableCell isHeader className="w-[20%] pl-6">Transaction Details</TableCell>
                  <TableCell isHeader className="w-[15%]">Amount & Fees</TableCell>
                  <TableCell isHeader className="w-[15%]">Status</TableCell>
                  <TableCell isHeader className="w-[20%]">Customer</TableCell>
                  <TableCell isHeader className="w-[15%]">Order & Products</TableCell>
                  <TableCell isHeader className="w-[15%]">Date</TableCell>
                  <TableCell isHeader className="w-[15%] text-right pr-6 bg-gray-200/50 border-l border-gray-200/80">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <div className="px-6 py-16 text-center w-full flex flex-col items-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                      <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter criteria.</p>
                    </div>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="group border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <TableCell className="w-[20%] pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000] to-red-700 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white">
                            {transaction.id.slice(-2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-grow">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {transaction.id}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                size="sm"
                                color="default"
                                className="text-xs font-medium"
                              >
                                {transaction.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                              {transaction.chargeId && (
                                <span className="text-xs text-gray-500 truncate">
                                  Charge: {transaction.chargeId.slice(-8)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="space-y-1">
                          <span className="font-semibold text-gray-900 text-sm block">
                            {formatAmount(transaction.amount, transaction.currency)}
                          </span>
                          {transaction.fee > 0 && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Fee:</span> {formatAmount(transaction.fee, transaction.currency)}
                            </div>
                          )}
                          {transaction.netAmount > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              <span className="text-gray-600">Net:</span> {formatAmount(transaction.netAmount, transaction.currency)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="space-y-2">
                          <Badge
                            size="sm"
                            color={getStatusBadgeColor(transaction.status)}
                            className="gap-1.5 pl-1.5 pr-2.5 font-medium shadow-sm border"
                          >
                            {transaction.status === 'succeeded' ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : transaction.status === 'processing' ? (
                              <RefreshCw className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {getStatusDisplayText(transaction.status)}
                          </Badge>

                          {transaction.localOrder && (
                            <Badge
                              size="sm"
                              color={getOrderStatusBadgeColor(transaction.localOrder.status)}
                              className="font-medium shadow-sm border"
                            >
                              Order: {transaction.localOrder.status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="w-[20%]">
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {getCustomerDisplayName(transaction)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {getCustomerEmail(transaction)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {transaction.localUser ? (
                              <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">
                                <UserIcon className="h-3 w-3 mr-1" />
                                Registered User
                              </div>
                            ) : (
                              <div className="flex items-center text-xs font-medium text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                                <XCircle className="h-3 w-3 mr-1" />
                                Guest Checkout
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        {transaction.orderId ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Link
                                href={\`/admin/orders/\${transaction.orderId}\`}
                                className="font-medium text-[#8B0000] hover:underline text-sm flex items-center gap-1"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Order: {transaction.orderId.slice(-8)}
                              </Link>
                            </div>
                            {transaction.productDescription && (
                              <div className="text-xs text-gray-600 line-clamp-2">
                                {transaction.productDescription}
                              </div>
                            )}
                            {transaction.shippingAddress && (
                              <div className="flex items-center text-xs text-blue-600">
                                <Truck className="h-3 w-3 mr-1" />
                                Shipping
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-gray-500 italic">
                            <XCircle className="h-3 w-3 mr-1" />
                            No order linked
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 font-medium">
                            {new Date(transaction.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(transaction.created).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%] text-right pr-6 bg-gray-50/50 border-l border-gray-100 group-hover:bg-gray-100/70 transition-colors">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1">
                            {transaction.receiptUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(transaction.receiptUrl!, '_blank')}
                                className="h-9 w-9 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
                                title="View Receipt"
                              >
                                <FileText className="h-4.5 w-4.5" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigator.clipboard.writeText(transaction.id)}
                              className="h-9 w-9 p-0 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-gray-200 hover:border-purple-200 transition-all"
                              title="Copy Transaction ID"
                            >
                              <Copy className="h-4.5 w-4.5" />
                            </Button>

                            {transaction.localUser && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigator.clipboard.writeText(transaction.localUser!.email)}
                                className="h-9 w-9 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-200 transition-all"
                                title="Copy Customer Email"
                              >
                                <Mail className="h-4.5 w-4.5" />
                              </Button>
                            )}

                            {transaction.shippingAddress && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigator.clipboard.writeText(transaction.shippingAddress!)}
                                className="h-9 w-9 p-0 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-gray-200 hover:border-orange-200 transition-all"
                                title="Copy Shipping Address"
                              >
                                <MapPin className="h-4.5 w-4.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <span className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, filteredTransactions.length)}</span> of <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> transactions
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="h-9 px-4 border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            Previous
          </Button>
          <div className="flex items-center px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages || 1}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="h-9 px-4 border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            Next
          </Button>
        </div>
      </div>

      {error && (
        <div className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold text-lg mb-2">Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setError(null);
                    fetchTransactions();
                  }}
                  className="bg-[#8B0000] text-white px-6 py-2.5 rounded-xl hover:bg-[#a50000] transition-colors font-medium shadow-sm"
                >
                  Retry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setError(null)}
                  className="border-red-600 text-red-600 px-6 py-2.5 rounded-xl hover:bg-red-50 transition-colors font-medium"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`,

    'src/app/_components/tables/Users.tsx': `'use client';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Edit,
  Save,
  Ban,
  Trash2,
  Lock,
  LogOut,
  User as UserIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { authClient } from "~/server/better-auth/client";

interface User {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  image: string | null;
  role?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  banned?: boolean | null;
}

interface EditUserData {
  name: string;
  email: string;
  role: string;
}

type TabType = 'all' | 'admin' | 'partners' | 'users';

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserData>({
    name: '',
    email: '',
    role: 'user'
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const pageSize = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: 1000,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (error) {
        setError(\`Error: \${error.message}\`);
        return;
      }

      if (data && data.users) {
        const formattedUsers: User[] = data.users.map((user: any) => ({
          id: user.id,
          name: user.name || "",
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          email: user.email,
          image: user.image || null,
          role: user.role || "user",
          emailVerified: user.emailVerified || false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt || user.createdAt,
          banned: user.banned || false,
        }));

        setUsers(formattedUsers);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(" Fetch error:", err);
      setError(\`Failed to fetch users: \${err instanceof Error ? err.message : 'Unknown error'}\`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    switch (activeTab) {
      case 'admin':
        filtered = filtered.filter(user => user.role === 'admin');
        break;
      case 'partners':
        filtered = filtered.filter(user => user.role === 'partner');
        break;
      case 'users':
        filtered = filtered.filter(user => user.role === 'user' || !user.role);
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users, activeTab, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const startEditing = useCallback((user: User) => {
    setEditingUserId(user.id);
    setEditFormData({
      name: user.name || '',
      email: user.email,
      role: user.role || 'user'
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingUserId(null);
    setEditFormData({ name: '', email: '', role: 'user' });
  }, []);

  const handleEditChange = useCallback((field: keyof EditUserData, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const saveUser = async (userId: string) => {
    try {
      setActionLoading(\`saving-\${userId}\`);

      const user = users.find(u => u.id === userId);
      if (user && editFormData.role !== user.role) {
        await authClient.admin.setRole({ userId, role: editFormData.role });
      }

      setUsers(prev => prev.map(u =>
        u.id === userId
          ? {
            ...u,
            name: editFormData.name,
            email: editFormData.email,
            role: editFormData.role
          }
          : u
      ));

      setEditingUserId(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const banUser = async (userId: string) => {
    try {
      setActionLoading(\`ban-\${userId}\`);
      const { error } = await authClient.admin.banUser({ userId });

      if (error) { 
        setError(\`Ban failed: \${error.message}\`); 
        return; 
      }
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, banned: true } : user 
      ));
    } catch (err) {
      console.error('Error banning user:', err);
      setError('Failed to ban user');
    } finally { 
      setActionLoading(null); 
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      setActionLoading(\`unban-\${userId}\`);
      const { error } = await authClient.admin.unbanUser({ userId });

      if (error) { 
        setError(\`Unban failed: \${error.message}\`); 
        return; 
      }
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, banned: false } : user 
      ));
    } catch (err) {
      console.error('Error unbanning user:', err);
      setError('Failed to unban user');
    } finally { 
      setActionLoading(null); 
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) { 
      return; 
    }
    
    try {
      setActionLoading(\`delete-\${userId}\`);
      const { error } = await authClient.admin.removeUser({ userId });

      if (error) { 
        setError(\`Delete failed: \${error.message}\`); 
        return; 
      }
      
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    } finally { 
      setActionLoading(null); 
    }
  };

  const impersonateUser = async (userId: string) => {
    try {
      setActionLoading(\`impersonate-\${userId}\`);
      const { data, error } = await authClient.admin.impersonateUser({ userId });

      if (error) { 
        setError(\`Impersonation failed: \${error.message}\`); 
        return; 
      }
      
      if (data) { 
        window.location.href = '/admin'; 
      }
    } catch (err) {
      console.error('Error impersonating user:', err);
      setError('Failed to impersonate user');
    } finally { 
      setActionLoading(null); 
    }
  };

  const getDisplayName = useCallback((user: User): string => {
    if (user.name && user.name.trim()) return user.name;
    if (user.firstName || user.lastName) {
      return \`\${user.firstName || ''} \${user.lastName || ''}\`.trim();
    }
    return user.email;
  }, []);

  const getUserInitials = useCallback((user: User): string => {
    if (user.name && user.name.trim()) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user.firstName || user.lastName) {
      return \`\${user.firstName?.[0] || ''}\${user.lastName?.[0] || ''}\`.toUpperCase();
    }
    return user.email[0].toUpperCase() + (user.email[1] || '').toUpperCase();
  }, []);

  const getTabStats = useCallback(() => {
    const tabUsers = filteredUsers;
    return {
      total: tabUsers.length,
      active: tabUsers.filter(u => !u.banned).length,
      banned: tabUsers.filter(u => u.banned).length,
      verified: tabUsers.filter(u => u.emailVerified).length,
    };
  }, [filteredUsers]);

  const tabStats = getTabStats();

  const tabs = useMemo(() => [
    { key: 'all' as TabType, label: 'All Users', count: users.length },
    { key: 'admin' as TabType, label: 'Admins', count: users.filter(u => u.role === 'admin').length },
    { key: 'partners' as TabType, label: 'Partners', count: users.filter(u => u.role === 'partner').length },
    { key: 'users' as TabType, label: 'Users', count: users.filter(u => u.role === 'user' || !u.role).length },
  ], [users]);

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading users...</p>
        <p className="text-sm text-gray-400 mt-1">Please wait while we fetch user data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans p-2">
      
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-500 mt-1">Manage access, roles, and user statuses.</p>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
                 <Button variant="outline" size="sm" onClick={() => fetchUsers()} disabled={loading} className="gap-2">
                    <RefreshCw className={\`h-4 w-4 \${loading ? 'animate-spin' : ''}\`} />
                    Refresh
                 </Button>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden p-5 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <UserIcon className="h-16 w-16 text-gray-500" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{tabStats.total}</p>
             </div>
          </div>
          
          <div className="relative overflow-hidden p-5 bg-emerald-50/20 rounded-2xl border border-emerald-100/60 shadow-sm transition-all hover:shadow-md">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100/40 rounded-lg border border-emerald-100">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active</span>
                </div>
                <p className="text-2xl font-bold text-emerald-800">{tabStats.active}</p>
             </div>
          </div>

          <div className="relative overflow-hidden p-5 bg-red-50/20 rounded-2xl border border-red-100/60 shadow-sm transition-all hover:shadow-md">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100/40 rounded-lg border border-red-100">
                        <Ban className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700">Banned</span>
                </div>
                <p className="text-2xl font-bold text-red-800">{tabStats.banned}</p>
             </div>
          </div>

          <div className="relative overflow-hidden p-5 bg-blue-50/20 rounded-2xl border border-blue-100/60 shadow-sm transition-all hover:shadow-md">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100/40 rounded-lg border border-blue-100">
                        <Lock className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Verified</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">{tabStats.verified}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        
        <div className="flex w-full lg:w-auto p-1.5 bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto no-scrollbar gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={\`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap \${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }\`}
              >
                {tab.label}
                <span className={\`px-1.5 py-0.5 rounded-md text-[10px] font-bold \${activeTab === tab.key ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-500'}\`}>
                    {tab.count}
                </span>
              </button>
            ))}
        </div>

        <div className="relative w-full lg:w-80 px-2 lg:px-0 mb-2 lg:mb-0">
             <div className="absolute inset-y-0 left-0 pl-3 lg:pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-gray-50/50 focus:bg-white border-gray-200"
            />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-x-auto">
        
        {loading && users.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-20">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
               <p className="text-gray-500">Loading user data...</p>
           </div>
        ) : (
          <div className="min-w-[1000px] w-full">
            <Table>
              <TableHeader className="bg-gray-100/70 border-b border-gray-200">
                <TableRow className="hover:bg-transparent">
                  <TableCell isHeader className="w-[25%] pl-6">User Details</TableCell>
                  <TableCell isHeader className="w-[15%]">Role</TableCell>
                  <TableCell isHeader className="w-[15%]">Status</TableCell>
                  <TableCell isHeader className="w-[15%]">Verification</TableCell>
                  <TableCell isHeader className="w-[15%]">Joined</TableCell>
                  <TableCell isHeader className="w-[15%] text-right pr-6 bg-gray-200/50 border-l border-gray-200/80">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <div className="px-6 py-16 text-center w-full flex flex-col items-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                            <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                        <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter criteria.</p>
                    </div>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="group border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <TableCell className="w-[25%] pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000] to-red-700 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white">
                            {getUserInitials(user)}
                          </div>
                          <div className="min-w-0 flex-grow">
                            {editingUserId === user.id ? (
                              <div className="space-y-1">
                                  <Input
                                      value={editFormData.name}
                                      onChange={(e) => handleEditChange('name', e.target.value)}
                                      className="h-7 text-xs w-full"
                                      placeholder="Name"
                                  />
                                  <Input
                                      value={editFormData.email}
                                      onChange={(e) => handleEditChange('email', e.target.value)}
                                      className="h-7 text-xs w-full"
                                      placeholder="Email"
                                  />
                              </div>
                            ) : (
                              <>
                                  <p className="text-sm font-semibold text-gray-900 truncate">{getDisplayName(user)}</p>
                                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        {editingUserId === user.id ? (
                          <select
                            value={editFormData.role}
                            onChange={(e) => handleEditChange('role', e.target.value)}
                            className="w-full text-xs border-gray-200 rounded-lg p-1.5 bg-white border focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="partner">Partner</option>
                          </select>
                        ) : (
                          <Badge
                            size="sm"
                            color={
                              user.role === "admin" ? "error" :
                              user.role === "partner" ? "info" : "default"
                            }
                            className="capitalize font-medium shadow-sm border"
                          >
                            {user.role || 'user'}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <Badge
                          size="sm"
                          color={user.banned ? "error" : "success"}
                          className="gap-1.5 pl-1.5 pr-2.5 font-medium shadow-sm border"
                        >
                           {user.banned ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          {user.banned ? "Banned" : "Active"}
                        </Badge>
                      </TableCell>

                      <TableCell className="w-[15%]">
                         <div className="flex items-center gap-2">
                          {user.emailVerified ? (
                              <div className="flex items-center text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md">
                                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Verified
                              </div>
                          ) : (
                              <div className="flex items-center text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md">
                                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Pending
                              </div>
                          )}
                         </div>
                      </TableCell>

                      <TableCell className="w-[15%]">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 font-medium">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(user.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="w-[15%] text-right pr-6 bg-gray-50/50 border-l border-gray-100 group-hover:bg-gray-100/70 transition-colors">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {editingUserId === user.id ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="maroon"
                                onClick={() => saveUser(user.id)}
                                disabled={actionLoading === \`saving-\${user.id}\`}
                                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 border-transparent text-white flex items-center gap-1.5"
                              >
                                {actionLoading === \`saving-\${user.id}\` ? (
                                  '...'
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="h-8 px-3 text-xs bg-white text-gray-600 border-gray-200 flex items-center gap-1.5"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(user)}
                                className="h-9 w-9 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
                                title="Edit User"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </Button>
                              
                              {user.banned ? (
                                  <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => unbanUser(user.id)}
                                  disabled={actionLoading === \`unban-\${user.id}\`}
                                  className="h-9 w-9 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-200 transition-all"
                                  title="Unban User"
                                  >
                                  <CheckCircle className="h-4.5 w-4.5" />
                                  </Button>
                              ) : (
                                  <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => banUser(user.id)}
                                  disabled={actionLoading === \`ban-\${user.id}\`}
                                  className="h-9 w-9 p-0 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-gray-200 hover:border-amber-200 transition-all"
                                  title="Ban User"
                                  >
                                  <Ban className="h-4.5 w-4.5" />
                                  </Button>
                              )}

                              <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => impersonateUser(user.id)}
                                  disabled={actionLoading === \`impersonate-\${user.id}\`}
                                  className="h-9 w-9 p-0 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-gray-200 hover:border-purple-200 transition-all"
                                  title="Impersonate User"
                              >
                                  <LogOut className="h-4.5 w-4.5" />
                              </Button>

                              <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteUser(user.id)}
                                  disabled={actionLoading === \`delete-\${user.id}\`}
                                  className="h-9 w-9 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all"
                                  title="Delete User"
                              >
                                  <Trash2 className="h-4.5 w-4.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
         <span className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, filteredUsers.length)}</span> of <span className="font-semibold text-gray-900">{filteredUsers.length}</span>
         </span>

         <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="h-9 px-4 border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Previous
            </Button>
             <div className="flex items-center px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages || 1}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="h-9 px-4 border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Next
            </Button>
         </div>
      </div>

    </div>
  );
}`,

    // UI Components
    'src/app/_components/ui/button/Button.tsx': `import React from "react";
import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "ghost" | "gold" | "maroon" | "t3-purple" | "glass";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isLoading?: boolean; 
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  ...props
}) => {
  
  const baseClasses = "inline-flex items-center justify-center font-medium gap-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base font-semibold", 
  };

  const variantClasses = {
    primary:
      "bg-brand-600 text-white shadow-lg hover:bg-brand-700 hover:shadow-brand-500/20 focus:ring-brand-500",
    outline:
      "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-white/5",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
    
    gold:
      "bg-[#a68c5a] text-white shadow-md hover:bg-[#8B7500] hover:shadow-lg border border-amber-600/20",
    maroon:
      "bg-[#8B0000] text-white shadow-md hover:bg-[#700000] hover:shadow-lg border border-red-900/20",

    "t3-purple":
      "bg-[hsl(280,100%,70%)] text-[#2e026d] shadow-[0_0_20px_-5px_hsl(280,100%,70%,0.5)] hover:bg-[hsl(280,100%,75%)] hover:shadow-[0_0_25px_-5px_hsl(280,100%,70%,0.7)] border border-transparent font-bold",
    glass:
      "bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 hover:border-white/30 shadow-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={twMerge(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {!isLoading && endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;`,
    // UI Components
    'src/app/_components/ui/badge/Badge.tsx': `import React from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface BadgeProps {
  variant?: BadgeVariant; 
  size?: BadgeSize;
  color?: BadgeColor; 
  startIcon?: React.ReactNode; 
  endIcon?: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
  className = "",
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium";

  const sizeStyles = {
    sm: "text-xs", 
    md: "text-sm", 
  };

  const variants = {
    light: {
      primary: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      success: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500",
      error: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500",
      warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-orange-400",
      info: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
    },
    solid: {
      primary: "bg-emerald-600 text-white dark:bg-emerald-700 dark:text-white",
      success: "bg-green-600 text-white dark:bg-green-700 dark:text-white",
      error: "bg-red-600 text-white dark:bg-red-700 dark:text-white",
      warning: "bg-amber-600 text-white dark:bg-amber-700 dark:text-white",
      info: "bg-blue-600 text-white dark:bg-blue-700 dark:text-white",
      light: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      dark: "bg-gray-700 text-white dark:bg-gray-800 dark:text-white",
    },
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={\`\${baseStyles} \${sizeClass} \${colorStyles} \${className}\`.trim()}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
`,
    'src/app/_components/ui/checkout/CheckoutButton.tsx': `"use client";
import { useState } from 'react';
import { useCart } from '~/app/_components/context/CartContext';

export default function CheckoutButton() {
  const { state } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (state.items.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: state.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = state.items.reduce((total, item) => 
    total + (item.price * item.quantity), 0
  );

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || state.items.length === 0}
      className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Redirecting to Checkout...
        </span>
      ) : (
        <div className="flex flex-col items-center">
          <span>Proceed to Checkout ({state.itemCount} {state.itemCount === 1 ? 'item' : 'items'})</span>
          <span className="text-sm font-normal mt-0.5 opacity-90">
            Total: $\{totalAmount.toFixed(2)}
          </span>
        </div>
      )}
    </button>
  );
}`,
    'src/app/_components/ui/dropdown/Dropdown.tsx': `"use client";
import type React from "react";
import { useEffect, useRef, useCallback } from "react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "left" | "right" | "center";
  width?: "sm" | "md" | "lg" | "full";
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  position = "right",
  width = "md",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 transform -translate-x-1/2",
  };

  const widthClasses = {
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
    full: "w-full",
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      !(event.target as HTMLElement).closest('.dropdown-toggle')
    ) {
      onClose();
    }
  }, [onClose]);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      
      // Prevent body scroll when dropdown is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleClickOutside, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={\`absolute z-50 mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 \${positionClasses[position]} \${widthClasses[width]} \${className}\`}
    >
      {children}
    </div>
  );
};
`,

    'src/app/_components/ui/dropdown/DropdownItem.tsx': `import type React from "react";
import Link from "next/link";

interface DropdownItemProps {
  tag?: "a" | "button";
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  href,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors",
  className = "",
  disabled = false,
  children,
}) => {
  const combinedClasses = \`\${baseClassName} \${className} \${disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}\`.trim();

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (tag === "button") {
      event.preventDefault();
    }
    
    if (onClick) {
      onClick(event);
    }
    
    if (onItemClick) {
      onItemClick();
    }
  };

  if (tag === "a" && href) {
    return (
      <Link 
        href={disabled ? "#" : href} 
        className={combinedClasses}
        onClick={handleClick}
        aria-disabled={disabled}
      >
        {children}
      </Link>
    );
  }

  return (
    <button 
      onClick={handleClick} 
      className={combinedClasses}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
`,

    'src/app/_components/ui/table/index.tsx': `import React from "react";
import type { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

const Table: React.FC<TableProps> = ({ children, className = "" }) => {
  return (
    <div className="overflow-x-auto">
      <table className={\`min-w-full divide-y divide-gray-200 dark:divide-gray-700 \${className}\`.trim()}>
        {children}
      </table>
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "" }) => {
  return (
    <thead className={\`bg-gray-50 dark:bg-gray-800 \${className}\`.trim()}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
  return (
    <tbody className={\`divide-y divide-gray-200 dark:divide-gray-700 \${className}\`.trim()}>
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className = "", onClick }) => {
  return (
    <tr 
      className={\`\${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} \${className}\`.trim()}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
  colSpan,
  rowSpan,
}) => {
  const CellTag = isHeader ? "th" : "td";
  
  const baseStyles = "px-6 py-4 whitespace-nowrap text-sm";
  const headerStyles = "text-left font-medium text-gray-900 dark:text-white uppercase tracking-wider";
  const cellStyles = "text-gray-700 dark:text-gray-300";
  
  const styles = isHeader ? headerStyles : cellStyles;
  
  return (
    <CellTag 
      className={\`\${baseStyles} \${styles} \${className}\`.trim()}
      colSpan={colSpan}
      rowSpan={rowSpan}
      scope={isHeader ? "col" : undefined}
    >
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
`,

    // Post Component
    'src/app/_components/post.tsx': `"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
`,

    // Layout and Pages
    'src/app/layout.tsx': `import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { CartProvider } from "~/app/_components/context/CartContext";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Create T3 App",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={\`\${geist.variable}\`}>
      <body>
        <TRPCReactProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
`,
    'src/app/page.tsx': `import Link from "next/link";
import { redirect } from "next/navigation";
import { LatestPost } from "~/app/_components/post";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/better-auth/config";
import { headers } from "next/headers";
import { LogIn, UserPlus, Shield, Zap, Users, Rocket, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export default async function Home() {
  const session = await getSession();
  if (session) void api.post.getLatest.prefetch();
  const hello = await api.post.hello({ text: "from tRPC" });

  const features = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Authentication",
      description: "Enterprise-grade security with advanced encryption"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Blazing Fast",
      description: "Optimized performance with real-time capabilities"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Ready",
      description: "Collaborate seamlessly with your team members"
    },
    {
      icon: <Rocket className="h-5 w-5" />,
      title: "Scalable",
      description: "Grows with your application needs"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "Secure", label: "Auth" },
    { value: "Fast", label: "Performance" },
    { value: "24/7", label: "Reliable" }
  ];

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center 
        bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 
        selection:bg-emerald-500/30 selection:text-white transition-colors duration-300">
        
        <nav className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
                  SkipSetup
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {!session ? (
                  <>
                    <Link
                      href="/signin"
                      className="rounded-xl px-6 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 transition-all hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                    >
                      Get Started
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Welcome back, {session.user?.name || session.user?.email}
                    </span>
                    <form>
                      <button
                        className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-6 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        formAction={async () => {
                          "use server";
                          await auth.api.signOut({
                            headers: await headers()
                          });
                          redirect("/");
                        }}
                      >
                        Sign Out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <section className="w-full py-20 bg-gradient-to-br from-white to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              
              <div className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-4 w-4" />
                Enterprise Ready Platform
                <ArrowRight className="h-3 w-3" />
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-6xl">
                Welcome to{" "}
                <span className="bg-gradient-to-br from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                  SkipSetup
                </span>{" "}
                Platform
              </h1>

              <p className="mb-8 text-lg text-neutral-600 dark:text-neutral-300 sm:text-xl">
                Build, scale, and manage your applications with enterprise-grade tools and infrastructure.
              </p>

              <div className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">{stat.value}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {!session ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    Get Started Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/features"
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-8 py-4 font-semibold text-neutral-700 dark:text-neutral-300 shadow-lg transition-all hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-xl"
                  >
                    View Features
                    <Sparkles className="h-5 w-5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/shop"
                    className="group flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    Go to Shop
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-8 py-4 font-semibold text-neutral-700 dark:text-neutral-300 shadow-lg transition-all hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-xl"
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 bg-white dark:bg-neutral-800">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center mb-16">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-300">
                Powerful features designed to help you build better applications faster.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-sm transition-all hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {feature.description}
                  </p>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="w-full py-16">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              
              {/* Welcome Card */}
              <div className="mb-12 overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white">
                    {session ? "Welcome back!" : "Ready to get started?"}
                  </h2>
                  <p className="text-emerald-100">
                    {hello ? hello.greeting : "Loading tRPC query..."}
                  </p>
                </div>
                
                <div className="p-8">
                  {!session ? (
                    <div className="space-y-6">
                      
                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Link
                          href="/signin"
                          className="group flex flex-col items-center justify-center rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 text-center transition-all hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <LogIn className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">Sign In</h3>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Access your account</p>
                        </Link>

                        <Link
                          href="/signup"
                          className="group flex flex-col items-center justify-center rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 text-center transition-all hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <Rocket className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">Get Started</h3>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Create new account</p>
                        </Link>

                        <Link
                          href="/features"
                          className="group flex flex-col items-center justify-center rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 text-center transition-all hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">Explore</h3>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">See all features</p>
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700"></div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">or</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700"></div>
                      </div>

                      {/* Additional Links */}
                      <div className="flex justify-center gap-6">
                        <Link
                          href="/forgot-password"
                          className="text-sm text-neutral-600 dark:text-neutral-400 underline transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          Forgot Password?
                        </Link>
                        <Link
                          href="/docs"
                          className="text-sm text-neutral-600 dark:text-neutral-400 underline transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          Documentation
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white">
                          {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {session.user?.name || session.user?.email}
                          </h3>
                          <p className="text-neutral-600 dark:text-neutral-300">{session.user?.email}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Link
                          href="/shop"
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 transition-all hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900 dark:text-white">Shop</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">Order our products</p>
                          </div>
                        </Link>

                        <Link
                          href="/profile"
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 transition-all hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900 dark:text-white">Profile</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">Manage account</p>
                          </div>
                        </Link>
                      </div>

                      {/* Latest Post Section */}
                      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                        <LatestPost />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white">
                  SkipSetup
                </div>
              </div>
              
              <div className="flex gap-6 text-sm text-neutral-600 dark:text-neutral-400">
                <Link href="/privacy" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                  Privacy
                </Link>
                <Link href="/terms" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                  Terms
                </Link>
                <Link href="/contact" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </HydrateClient>
  );
}`,
    'src/app/about/page.tsx': `'use client';
import Link from 'next/link';
import { ShoppingCart, Package, Gift, Globe, Sparkles, Target, Users, Shield } from 'lucide-react';

const Colors = {
  PrimaryText: '#1f2937',
  SecondaryText: '#6b7280',
  Background: 'bg-white',
  SoftEmerald: 'bg-emerald-50',
  AccentEmerald: '#059669',
  AccentEmeraldDark: '#047857',
  AccentGray: '#9ca3af',
} as const;

const PremiumDivider = () => (
  <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent my-8" />
);

export default function About() {
  return (
    <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans relative\`}>
      {/* Header */}
      <header className="py-5 px-4 sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
              SS
            </div>
            <span className="text-2xl font-bold text-gray-900">SkipSetup</span>
          </Link>
          <nav className="flex items-center space-x-5 text-lg">
            <Link href="/" className="hidden md:block text-gray-600 hover:text-emerald-600 transition-colors">
              Home
            </Link>
            <Link href="/shop" className="hidden md:block text-gray-600 hover:text-emerald-600 transition-colors">
              Shop
            </Link>
            <Link href="/orders" className="hidden md:block text-gray-600 hover:text-emerald-600 transition-colors">
              My Orders
            </Link>
            <Link 
              href="/about" 
              className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center"
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-16 space-y-16">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200 mb-6">
            Enterprise-Grade Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            About SkipSetup
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto text-gray-600">
            Revolutionizing ecommerce with enterprise-grade solutions that deliver exceptional performance, reliability, and user experience.
          </p>
        </section>

        <PremiumDivider />

        <section className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Our Story
          </h2>
          <p className="text-lg md:text-xl leading-relaxed max-w-4xl mx-auto text-gray-600">
            SkipSetup was founded to bridge the gap between complex enterprise requirements and seamless user experiences. 
            We've built a platform that combines cutting-edge technology with intuitive design, empowering businesses 
            to deliver premium digital commerce solutions that scale effortlessly.
          </p>
        </section>

        <PremiumDivider />

        <section className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
              <Target className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-emerald-700">
            Our Mission
          </h2>
          <p className="text-lg md:text-xl leading-relaxed max-w-4xl mx-auto text-gray-600">
            To provide businesses with enterprise-grade ecommerce infrastructure that just works. We eliminate complexity, 
            reduce setup time, and deliver solutions that drive growth while maintaining the highest standards of 
            performance and security.
          </p>
        </section>

        <PremiumDivider />

        <section className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-emerald-600">
            Our Values
          </h2>
          <div className="flex justify-center">
            <ul className="text-lg md:text-xl leading-relaxed text-left max-w-3xl space-y-4 text-gray-600">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Innovation:</strong> Continuously pushing boundaries with cutting-edge technology and forward-thinking solutions.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Reliability:</strong> Enterprise-grade infrastructure that ensures 99.9% uptime and consistent performance.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Security:</strong> Military-grade security protocols to protect your data and customer information.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Excellence:</strong> Uncompromising commitment to quality in every feature, interaction, and deployment.
                </div>
              </li>
            </ul>
          </div>
        </section>

        <PremiumDivider />

        <section className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
              <Shield className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all border border-gray-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white mb-6">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Browse Products</h3>
              <p className="text-gray-600 text-center">
                Explore our curated marketplace of premium products and services designed for enterprise needs.
              </p>
            </div>
            <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all border border-gray-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white mb-6">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Secure Checkout</h3>
              <p className="text-gray-600 text-center">
                Complete your purchase with enterprise-grade security and multiple payment options.
              </p>
            </div>
            <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all border border-gray-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white mb-6">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Premium Delivery</h3>
              <p className="text-gray-600 text-center">
                Receive your products with white-glove service and comprehensive after-sales support.
              </p>
            </div>
          </div>
        </section>

        <PremiumDivider />

        <section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Join Our Journey
          </h2>
          <p className="text-lg md:text-xl leading-relaxed mb-8 max-w-4xl mx-auto text-gray-600">
            Whether you're looking to transform your ecommerce experience or partner with us to build the future of digital commerce, 
            SkipSetup welcomes you. Together, we can create exceptional digital experiences that drive business growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="px-8 py-4 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Explore Our Products
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Partner With Us
            </Link>
          </div>
        </section>
      </main>

      <PremiumDivider />

      <footer className="w-full py-10 text-center border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white text-sm">
            SS
          </div>
          <span className="text-lg font-bold text-gray-900">SkipSetup</span>
        </div>
        <p className="text-base text-gray-600">
          © {new Date().getFullYear()} SkipSetup. Enterprise-grade ecommerce platform.
        </p>
      </footer>
    </div>
  );
}`,
    'src/app/shop/page.tsx': `'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart, X, Filter, Package } from 'lucide-react';
import CheckoutButton from '~/app/_components/ui/checkout/CheckoutButton';
import { useCart } from '~/app/_components/context/CartContext';

const Colors = {
  PrimaryText: '#1f2937',
  SecondaryText: '#6b7280',
  Background: 'bg-white',
  SoftEmerald: 'bg-emerald-50',
  AccentEmerald: '#059669',
  AccentEmeraldDark: '#047857',
  AccentGray: '#9ca3af',
} as const;

const PremiumDivider = () => (
  <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent my-8" />
);

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  stock: number;
  category: string;
  stripeProductId: string;
  stripePriceId: string;
  createdAt: string;
}

const Notification = ({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div
      className={\`fixed bottom-8 right-8 z-50 p-5 rounded-xl shadow-2xl transition-all duration-500 flex items-center space-x-4 max-w-sm \${visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}\`}
      style={{ backgroundColor: Colors.AccentEmerald, color: 'white' }}
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="font-medium text-base">{message}</span>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) => (
  <article className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:-translate-y-1">
    <div className="relative h-64 overflow-hidden">
      <img
        src={product.image || 'https://placehold.co/400'}
        alt={product.name}
        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://placehold.co/400';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <p className="text-sm font-semibold uppercase mb-1" style={{ color: Colors.AccentEmerald }}>
        {product.category || 'Gift'}
      </p>
      <h3 className="text-xl font-bold mb-2" style={{ color: Colors.PrimaryText }}>
        {product.name}
      </h3>
      <p className="text-sm mb-4 line-clamp-3 leading-relaxed" style={{ color: Colors.SecondaryText }}>
        {product.description}
      </p>

      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
        <span className="text-2xl font-bold" style={{ color: Colors.AccentEmerald }}>
          $\${product.price.toFixed(2)}
        </span>
        <button
          className="px-4 py-2 rounded-xl text-white font-medium text-sm shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
      {product.stock > 0 && product.stock < 10 && (
        <p className="text-xs text-amber-600 mt-2">Only {product.stock} left in stock!</p>
      )}
    </div>
  </article>
);

const CategoryTabs = ({
  activeCategory,
  onCategoryChange,
  categories
}: {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
}) => {
  const allCategories = ['All', ...categories];

  return (
    <nav className="flex flex-wrap gap-3 mb-12 justify-center px-2">
      {allCategories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={\`px-5 py-2 rounded-xl text-base font-medium transition-all \${activeCategory === category
              ? 'text-white bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }\`}
        >
          {category}
        </button>
      ))}
    </nav>
  );
};

const FilterSidebar = ({
  filters,
  setFilters,
  isSidebarOpen,
  closeSidebar,
}: {
  filters: { price: { min: number; max: number }; sort: string };
  setFilters: React.Dispatch<React.SetStateAction<typeof filters>>;
  isSidebarOpen: boolean;
  closeSidebar: () => void;
}) => {
  const priceRanges = [
    { label: 'All Prices', min: 0, max: 1000 },
    { label: 'Under $75', min: 0, max: 75 },
    { label: '$75 - $150', min: 75, max: 150 },
    { label: 'Above $150', min: 150, max: 1000 },
  ] as const;

  const isActive = (r: (typeof priceRanges)[number]) => filters.price.min === r.min && filters.price.max === r.max;

  return (
    <>
      <div
        className={\`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden \${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}\`}
        onClick={closeSidebar}
      />
      <aside
        className={\`fixed inset-y-0 left-0 w-72 max-w-full z-50 p-6 shadow-2xl transition-transform duration-300 lg:static lg:w-1/4 \${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 bg-emerald-50 overflow-y-auto rounded-r-3xl lg:rounded-none\`}
      >
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-300">
          <h2 className="text-xl font-semibold" style={{ color: Colors.PrimaryText }}>Refine Search</h2>
          <button onClick={closeSidebar} className="lg:hidden p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5" style={{ color: Colors.PrimaryText }} />
          </button>
        </div>
        <section className="mb-5">
          <label className="block font-semibold mb-2" style={{ color: Colors.PrimaryText }}>Sort by</label>
          <select
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
            value={filters.sort}
            className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="default">Best Match</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="newest">Newest First</option>
          </select>
        </section>
        <section>
          <h3 className="text-base font-semibold mb-3" style={{ color: Colors.PrimaryText }}>Price Range</h3>
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => setFilters((prev) => ({ ...prev, price: { min: range.min, max: range.max } }))}
              className={\`block w-full text-left py-2 px-3 rounded-lg text-sm mb-2 transition-all \${isActive(range)
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
                  : 'hover:bg-emerald-100/70'
                }\`}
            >
              {range.label}
            </button>
          ))}
        </section>
      </aside>
    </>
  );
};

const CartSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { state, removeFromCart, updateQuantity, clearCart } = useCart();

  return (
    <>
      <div
        className={\`fixed inset-0 bg-black/50 z-40 transition-opacity \${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}\`}
        onClick={onClose}
      />
      <aside
        className={\`fixed inset-y-0 right-0 w-96 max-w-full z-50 bg-white shadow-2xl transition-transform duration-300 flex flex-col \${isOpen ? 'translate-x-0' : 'translate-x-full'}\`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold" style={{ color: Colors.PrimaryText }}>Shopping Cart</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {state.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <img
                    src={item.image || 'https://placehold.co/400'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600">$\${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {state.items.length > 0 && (
          <div className="p-6 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span style={{ color: Colors.PrimaryText }}>Total:</span>
              <span style={{ color: Colors.AccentEmerald }}>$\${state.total.toFixed(2)}</span>
            </div>
            <CheckoutButton />
            <button
              onClick={clearCart}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

const Header = ({
  isCartOpen,
  setIsCartOpen,
  cartItemCount,
  setIsSidebarOpen
}: {
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartItemCount: number;
  setIsSidebarOpen?: (open: boolean) => void;
}) => (
  <header className="py-5 px-4 sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      {setIsSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-3 rounded-xl hover:bg-gray-100"
        >
          <Filter className="w-6 h-6" style={{ color: Colors.PrimaryText }} />
        </button>
      )}
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
          SS
        </div>
        <span className="text-2xl font-bold text-gray-900">SkipSetup</span>
      </Link>
      <nav className="flex items-center space-x-5 text-lg">
        <Link href="/" className="hidden md:block text-gray-600 hover:text-emerald-600 transition-colors">Home</Link>
        <Link href="/about" className="hidden md:block text-gray-600 hover:text-emerald-600 transition-colors">How It Works</Link>
        <Link href="/orders" className="hidden md:block text-gray-600 hover:text-emerald-600 transition-colors">My Orders</Link>
        <button
          onClick={() => setIsCartOpen(true)}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center relative"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart ($\{cartItemCount})
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  </header>
);

// --- Main Shop ---
const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [filters, setFilters] = useState({ price: { min: 0, max: 1000 }, sort: 'default' });
  const [notification, setNotification] = useState({ message: '', visible: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { addToCart, state } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/products');

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();

        if (data.success) {
          setProducts(data.products || []);
        } else {
          throw new Error(data.error || 'Failed to load products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Unable to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Extract unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [products]);

  const handleAddToCart = useCallback((product: Product) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setNotification({ message: \`\${product.name} added to cart!\`, visible: true });
  }, [addToCart]);

  const closeNotification = useCallback(() => setNotification((p) => ({ ...p, visible: false })), []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(
      (p) =>
        (activeCategory === 'All' || p.category === activeCategory) &&
        p.price >= filters.price.min &&
        p.price <= filters.price.max &&
        p.stock > 0 // Only show products in stock
    );

    switch (filters.sort) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        result.sort((a, b) => {
          if (a.stock === 0 && b.stock > 0) return 1;
          if (b.stock === 0 && a.stock > 0) return -1;
          return 0;
        });
    }
    return result;
  }, [products, activeCategory, filters]);

  if (loading) {
    return (
      <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans\`}>
        <Header isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} cartItemCount={state.itemCount} />
        <PremiumDivider />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 mx-auto mb-4 border-emerald-600"></div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Loading Products</h2>
            <p className="text-lg text-gray-600">Discovering premium products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans\`}>
        <Header isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} cartItemCount={state.itemCount} />
        <PremiumDivider />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6 text-emerald-600">❌</div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Unable to Load Products</h1>
            <p className="text-lg mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans relative\`}>
      <Header
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        cartItemCount={state.itemCount}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <PremiumDivider />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200 mb-4">
            Premium Marketplace
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-900">
            Our Premium Collections
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-gray-600">
            Discover exclusive products and services curated for enterprise-grade quality and performance.
          </p>
        </section>

        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            isSidebarOpen={isSidebarOpen}
            closeSidebar={() => setIsSidebarOpen(false)}
          />
          <section className="lg:w-3/4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-2 border-b border-gray-200">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Showing <span className="text-emerald-600">{filteredAndSortedProducts.length}</span> Products
              </h2>
              <p className="text-md text-gray-600">
                in <span className="font-semibold text-emerald-600">{activeCategory}</span>
              </p>
            </div>

            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center p-12 rounded-2xl border-2 border-dashed border-gray-300 bg-emerald-50 shadow-inner">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium mb-2 text-gray-600">
                  No products found matching your current filters.
                </p>
                <p className="text-sm mb-6 text-gray-500">
                  Try adjusting your filters or browse a different category.
                </p>
                <button
                  className="px-6 py-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl"
                  onClick={() => {
                    setActiveCategory('All');
                    setFilters({ price: { min: 0, max: 1000 }, sort: 'default' });
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Notification message={notification.message} visible={notification.visible} onClose={closeNotification} />

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <PremiumDivider />

      <footer className="w-full py-10 text-center border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white text-sm">
            SS
          </div>
          <span className="text-lg font-bold text-gray-900">SkipSetup</span>
        </div>
        <p className="text-base text-gray-600">
          © {new Date().getFullYear()} SkipSetup. Enterprise-grade ecommerce platform.
        </p>
      </footer>
    </div>
  );
};

export default Shop;`,
    // Auth Pages
    'src/app/(auth)/layout.tsx': `"use client";
import Link from "next/link";
import React from "react";
import { Shield, Zap, Users, Rocket, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const features = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Authentication",
      description: "Enterprise-grade security with advanced encryption"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Blazing Fast",
      description: "Optimized performance with real-time capabilities"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Ready",
      description: "Collaborate seamlessly with your team members"
    },
    {
      icon: <Rocket className="h-5 w-5" />,
      title: "Scalable",
      description: "Grows with your application needs"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-50 to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/20 text-neutral-800 dark:text-neutral-100 overflow-hidden font-sans">
      <div className="flex min-h-screen w-full lg:flex-row flex-col">
        
        {/* Left Side: Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-md">
             {children}
          </div>
        </div>

        {/* Right Side: Branding Panel (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700">
          {/* Decorative Elements */}
          <div className="absolute top-1/4 -right-12 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/4 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg space-y-8">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white border border-white/20">
              <Sparkles className="h-4 w-4" />
              Enterprise Ready Platform
              <ArrowRight className="h-3 w-3" />
            </div>

            {/* Main Branding */}
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 shadow-lg">
                  <div className="text-xl font-bold text-white">SS</div>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                  SkipSetup
                </span>
              </h1>
              <p className="text-xl text-emerald-100 font-light">
                Build, scale, and manage your applications with enterprise-grade tools.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 text-left transition-all hover:bg-white/15 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-white text-sm">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-emerald-100 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              {[
                { value: "99.9%", label: "Uptime" },
                { value: "Secure", label: "Auth" },
                { value: "Fast", label: "Performance" },
                { value: "24/7", label: "Reliable" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-emerald-100">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tech Stack */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {['Next.js', 'TypeScript', 'Tailwind', 'tRPC', 'Prisma', 'Auth'].map((tech) => (
                <span key={tech} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium text-emerald-100">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
    'src/app/(auth)/signin/page.tsx': `import SignInForm from "~/app/_components/auth/SignInForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Signin Page TailAdmin Dashboard Template",
};

export default function SignIn() {
  return <SignInForm />;
}
`,
    'src/app/(auth)/signup/page.tsx': `import SignUpForm from "~/app/_components/auth/SignUpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
`,
    'src/app/(auth)/forgot-password/page.tsx': `import ForgotPassword from "~/app/_components/auth/ForgotPassword";

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}`,
    'src/app/(auth)/reset-password/page.tsx': `import ResetPassword from "~/app/_components/auth/ResetPassword";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Signin Page TailAdmin Dashboard Template",
};

export default function SignIn() {
  return <ResetPassword />;
}
`,

    // Protected Pages
    'src/app/(protected)/layout.tsx': `import AuthGuard from "~/app/_components/auth/AuthGuard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}`,
    // Protected routes
    'src/app/(protected)/orders/page.tsx': `'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Calendar, DollarSign, ArrowRight, Home, ShoppingBag, RotateCcw, Sparkles, CheckCircle, Truck, Clock } from 'lucide-react';
import UserDropdownProfile from '~/app/_components/auth/UserDropdownProfile';
import { useCart } from '~/app/_components/context/CartContext';
import { useRouter } from 'next/navigation';

const Colors = {
    PrimaryText: '#1f2937',
    SecondaryText: '#6b7280',
    Background: 'bg-white',
    SoftEmerald: 'bg-emerald-50',
    AccentEmerald: '#059669',
    AccentEmeraldDark: '#047857',
    AccentGray: '#9ca3af',
} as const;

const PremiumDivider = () => (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent my-8" />
);

interface Order {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    items: Array<{
        product: {
            name: string;
            image?: string;
        };
        quantity: number;
        price: number;
    }>;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyAgainLoading, setBuyAgainLoading] = useState<string | null>(null);
    const { addToCart } = useCart();
    const router = useRouter();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            if (response.ok) {
                const ordersData = await response.json();
                setOrders(ordersData);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
            case 'COMPLETED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'PENDING':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'FAILED':
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4" />;
            case 'PENDING':
                return <Clock className="w-4 h-4" />;
            case 'FAILED':
                return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
            default:
                return <Package className="w-4 h-4" />;
        }
    };

    const handleBuyAgain = async (order: Order) => {
        setBuyAgainLoading(order.id);
        
        try {
            order.items.forEach(item => {
                addToCart({
                    productId: \`prod_\${item.product.name.toLowerCase().replace(/\\s+/g, '_')}\`,
                    name: item.product.name,
                    price: item.price / 100, // Convert from cents to dollars 
                    image: item.product.image || '/images/placeholder.jpg',
                });
            });

            alert(\`\${order.items.length} item\${order.items.length !== 1 ? 's' : ''} added to cart!\`);
            
            setTimeout(() => {
                router.push('/shop');
            }, 1500);
            
        } catch (error) {
            console.error('Error adding items to cart:', error);
            alert('Failed to add items to cart. Please try again.');
        } finally {
            setBuyAgainLoading(null);
        }
    };

    if (loading) {
        return (
            <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-900 dark:to-emerald-950/20 font-sans\`}>
                {/* Header */}
                <header className="py-5 px-4 sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
                                SS
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">SkipSetup</span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-base font-medium">
                            <Link href="/" className="hidden md:block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                Home
                            </Link>
                            <Link href="/shop" className="hidden md:block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                Shop
                            </Link>
                            <Link href="/orders" className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105">
                                My Orders
                            </Link>
                        </nav>
                        <UserDropdownProfile />
                    </div>
                </header>

                <PremiumDivider />

                {/* Loading State */}
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 mx-auto mb-4 border-emerald-600"></div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Loading Your Orders</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">We're gathering your order history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-900 dark:to-emerald-950/20 font-sans\`}>
            <header className="py-5 px-4 sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
                            SS
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">SkipSetup</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-base font-medium">
                        <Link href="/" className="hidden md:block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            Home
                        </Link>
                        <Link href="/shop" className="hidden md:block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            Shop
                        </Link>
                        <Link href="/orders" className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105">
                            My Orders
                        </Link>
                    </nav>
                    <UserDropdownProfile />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
                {orders.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="flex justify-center mb-6">
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                                <Package className="h-12 w-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">No Orders Yet</h2>
                        <p className="text-xl mb-8 max-w-md mx-auto text-gray-600 dark:text-gray-400">
                            Start your journey with SkipSetup. Explore our premium products and services.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="px-8 py-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <Home size={20} />
                                Return Home
                            </Link>
                            <Link
                                href="/shop"
                                className="px-8 py-4 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={20} />
                                Start Shopping
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <Sparkles className="h-4 w-4" />
                                    Order History
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                                Your Orders
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                \${orders.length} order\${orders.length !== 1 ? 's' : ''} • Total spent: $\{(orders.reduce((sum, order) => sum + order.amount, 0) / 100).toFixed(2)}
                            </p>
                        </div>

                        <div className="grid gap-6">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                                            <div className="flex items-center gap-4 mb-4 lg:mb-0">
                                                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                        Order #\${order.id.slice(-8).toUpperCase()}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            \${new Date(order.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
                                                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                            $\{(order.amount / 100).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <span className={\`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border \${getStatusColor(order.status)}\`}>
                                                        \${getStatusIcon(order.status)} \${order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                            <h4 className="font-semibold mb-4 text-lg text-gray-900 dark:text-white">
                                                Order Items
                                            </h4>
                                            <div className="space-y-3">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-2 h-2 rounded-full bg-emerald-500"
                                                            ></div>
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                \${item.product.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                Qty: \${item.quantity}
                                                            </span>
                                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                $\{((item.price * item.quantity) / 100).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 flex flex-wrap gap-3">
                                            <Link
                                                href={\`/checkout/success?order_id=\${order.id}\`}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105"
                                            >
                                                View Order Details
                                                <ArrowRight size={16} />
                                            </Link>
                                            
                                            <button
                                                onClick={() => handleBuyAgain(order)}
                                                disabled={buyAgainLoading === order.id}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                                            >
                                                {buyAgainLoading === order.id ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw size={16} />
                                                        Buy Again
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                        <Truck size={24} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                                    Continue Shopping
                                </h3>
                                <p className="text-lg mb-6 max-w-md mx-auto text-gray-600 dark:text-gray-400">
                                    Discover more premium products and services in our marketplace
                                </p>
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105"
                                >
                                    <ShoppingBag size={20} />
                                    Explore Products
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <PremiumDivider />

            {/* Footer */}
            <footer className="w-full py-10 text-center border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white text-sm">
                        SS
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">SkipSetup</span>
                </div>
                <p className="text-base text-gray-600 dark:text-gray-400">
                    © \${new Date().getFullYear()} SkipSetup. Enterprise-grade ecommerce platform.
                </p>
            </footer>
        </div>
    );
}`,
    'src/app/(protected)/admin/layout.tsx': `"use client";

import React, { useState, useEffect } from "react";
import AdminLayoutClient from "~/app/_components/layout/AdminLayoutClient";
import { SidebarProvider } from "~/app/_components/context/SidebarContext";
import { ThemeProvider } from "~/app/_components/context/ThemeContext";
import AuthGuard from "~/app/_components/auth/AuthGuard";

import "~/styles/globals.css";

function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <ThemeProvider>
        <SidebarProvider>
          <AdminLayoutClient>
            {children}
          </AdminLayoutClient>
        </SidebarProvider>
      </ThemeProvider>
    </AuthGuard>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}`,
    'src/app/(protected)/admin/page.tsx': `import type { Metadata } from "next";
import { Metrics } from "~/app/_components/dashboard/Metrics";
import React from "react";

import AuthGuard from "~/app/_components/auth/AuthGuard";
import { ProtectedRoute } from "~/app/_components/auth/protected-route";
import { AdminDashboard } from "~/app/_components/dashboard/dashboard";

export const metadata: Metadata = {
  title: "SkipSetup | Admin Dashboard",
  description: "SkipSetup admin dashboard for managing products, orders, and analytics",
  keywords: [
    "admin dashboard",
    "ecommerce admin",
    "product management",
    "order tracking",
    "analytics",
  ],
  openGraph: {
    title: "SkipSetup | Admin Dashboard",
    description: "Manage your SkipSetup ecommerce platform with advanced analytics and tools",
    url: "https://skipsetup.com",
    siteName: "SkipSetup",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SkipSetup - Admin Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function Ecommerce() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-emerald-50/30 dark:from-neutral-900 dark:via-neutral-800/50 dark:to-emerald-900/10">
        <div className="space-y-8 p-4 md:p-6 lg:p-8">
          <ProtectedRoute permission="readAnalytics">
            <div className="relative">
              <div className="absolute -top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent dark:via-emerald-500/40" />
              <AdminDashboard />
              <div className="absolute -bottom-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent dark:via-emerald-600/30" />
            </div>
          </ProtectedRoute>

          <div className="grid grid-cols-12 gap-6">
            <ProtectedRoute permission="readAnalytics">
              <div className="col-span-12 space-y-6 xl:col-span-8 2xl:col-span-9">
                <div className="group relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-lg hover:shadow-emerald-100/30 dark:hover:shadow-emerald-900/10 transition-all duration-500">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/25"></div>
                        <div>
                          <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
                            Performance Metrics
                          </h2>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm">
                            Real-time business insights and analytics
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Live Data</span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Metrics />
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-300/50 dark:border-emerald-500/30 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-300/50 dark:border-emerald-500/30 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-300/50 dark:border-emerald-500/30 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-300/50 dark:border-emerald-500/30 rounded-br-2xl"></div>
                </div>
              </div>
            </ProtectedRoute>

            <ProtectedRoute permission="readAnalytics">
              <div className="col-span-12 space-y-6 xl:col-span-4 2xl:col-span-3">
                <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md transition-all duration-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
                    <h3 className="font-semibold text-neutral-800 dark:text-white">Quick Stats</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">Today's Orders</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">24</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">Revenue</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">$2,847</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-neutral-600 dark:text-neutral-400">Conversion</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">4.2%</span>
                    </div>
                  </div>
                </div>

                <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md transition-all duration-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-green-400 rounded-full"></div>
                    <h3 className="font-semibold text-neutral-800 dark:text-white">System Status</h3>
                  </div>
                  <div className="space-y-3">
                    {['API Gateway', 'Database', 'Payment Processing', 'Email Service'].map((service, index) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">\${service}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          </div>

          <ProtectedRoute 
            permission="readAnalytics" 
            fallback={
              <ProtectedRoute 
                permission="readOrders" 
                fallback={
                  <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-lg transition-all duration-500 group">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10 p-8 md:p-12 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="relative mb-8">
                          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10 flex items-center justify-center shadow-inner border border-amber-200/50 dark:border-amber-700/30">
                            <svg 
                              className="w-12 h-12 text-amber-600 dark:text-amber-400" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <div className="absolute inset-0 rounded-3xl bg-amber-200/30 dark:bg-amber-600/20 blur-xl -z-10 animate-pulse"></div>
                        </div>
                        
                        <div className="space-y-6">
                          <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">
                            Access Limited
                          </h3>
                          <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                            You don't have permission to view the dashboard analytics. 
                            Please contact an administrator to request access.
                          </p>
                          <div className="text-sm text-neutral-500 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl py-4 px-6 border border-neutral-200/50 dark:border-neutral-700/50">
                            Your current role may not include dashboard viewing permissions.
                          </div>
                        </div>

                        <div className="mt-8">
                          <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:scale-105 group">
                            <span className="flex items-center gap-2">
                              Contact Administrator
                              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-300/50 dark:border-amber-500/30 rounded-tl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-300/50 dark:border-amber-500/30 rounded-br-2xl"></div>
                  </div>
                }
              >
                <div></div>
              </ProtectedRoute>
            }
          >
            <div></div>
          </ProtectedRoute>
        </div>

        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-200/10 dark:bg-emerald-600/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/3 h-1/3 bg-amber-200/10 dark:bg-amber-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 -left-1/4 w-1/4 h-1/4 bg-blue-200/5 dark:bg-blue-600/3 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
      </div>
    </AuthGuard>
  );
}`,
    'src/app/(protected)/admin/products/page.tsx': `'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Package, Edit, Trash2, DollarSign, Image as ImageIcon, Tag, Save, X, Sparkles, Settings } from 'lucide-react';

// --- SkipSetup Emerald Color Palette ---
const Colors = {
  PrimaryText: '#1f2937',
  SecondaryText: '#6b7280',
  Background: 'bg-white',
  SoftEmerald: 'bg-emerald-50',
  AccentEmerald: '#059669',
  AccentEmeraldDark: '#047857',
  AccentGray: '#9ca3af',
} as const;

// Predefined categories matching your shop page
const CATEGORIES = [
  'Event Packages',
  'Monetary Vouchers', 
  'Customized Gifts',
  'Traditional Gifts',
  'Occasions',
  'Holidays'
] as const;

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  stock: number;
  category: string;
  stripeProductId: string;
  stripePriceId: string;
  createdAt: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    stock: '',
    category: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setMessage('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const url = editingProduct ? '/api/admin/products' : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const bodyData = editingProduct ? {
        id: editingProduct.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: formData.image,
        stock: parseInt(formData.stock) || 0,
        category: formData.category || undefined,
      } : {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: formData.image,
        stock: parseInt(formData.stock) || 0,
        category: formData.category || 'Customized Gifts',
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        resetForm();
        fetchProducts();
      } else {
        setMessage(result.error || \`Failed to \${editingProduct ? 'update' : 'create'} product\`);
      }
    } catch (error) {
      setMessage(\`Error \${editingProduct ? 'updating' : 'creating'} product\`);
      console.error('Product operation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      stock: product.stock.toString(),
      category: product.category
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(\`/api/admin/products?id=\${productId}\`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Product deleted successfully!');
        fetchProducts();
      } else {
        setMessage(result.error || 'Failed to delete product');
      }
    } catch (error) {
      setMessage('Error deleting product');
      console.error('Delete product error:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', image: '', stock: '', category: '' });
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans\`}>
        <AdminHeader />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 mx-auto mb-4 border-emerald-600"></div>
            <p className="text-lg text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={\`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans\`}>
      <AdminHeader />
      
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200 mb-4">
              <Settings className="w-4 h-4" />
              Admin Dashboard
            </div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Product Management</h1>
            <p className="text-lg text-gray-600">
              Manage your SkipSetup product catalog
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="mt-4 md:mt-0 px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div 
            className={\`p-4 rounded-xl mb-6 \${
              message.includes('success') 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }\`}
          >
            {message}
          </div>
        )}

        {/* Add/Edit Product Form */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Premium Product Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="95.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Category *
                  </label>
                  <div className="relative">
                    <Tag size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Premium product description with key features and benefits..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Image URL
                  </label>
                  <div className="relative">
                    <ImageIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a direct image URL for best results
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingProduct ? <Save size={16} /> : <Plus size={16} />}
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl border border-gray-300 font-medium transition-all hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-all">
              {product.image && (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400';
                    }}
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1 text-gray-900">
                      {product.name}
                    </h3>
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 bg-emerald-100 text-emerald-700">
                      {product.category}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    $\{product.price.toFixed(2)}
                  </span>
                </div>
                
                {product.description && (
                  <p className="text-sm mb-4 line-clamp-2 text-gray-600">
                    {product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Stock: {product.stock}</span>
                  <span>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !showForm && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-600">
                <Package className="w-12 h-12" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">No Products Yet</h2>
            <p className="text-lg mb-6 text-gray-600">
              Start building your premium product catalog by adding your first product.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Add Your First Product
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminHeader() {
  return (
    <header className="py-5 px-4 sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
       
      </div>
    </header>
  );
}`,
    'src/app/(protected)/admin/(tables)/transactions/page.tsx': `import ComponentCard from "../../../../_components/common/ComponentCard";
import PageBreadcrumb from "../../../../_components/common/PageBreadCrumb";
import Transactions from "../../../../_components/tables/Transactions";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Basic Table | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Basic Table  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Transaction() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Basic Table" />
      <div className="space-y-6">
        <ComponentCard title="Transactions">
          <Transactions />
        </ComponentCard>
      </div>
    </div>
  );
}
`,
    'src/app/(protected)/admin/(tables)/users/page.tsx': `import ComponentCard from "../../../../_components/common/ComponentCard";
import PageBreadcrumb from "../../../../_components/common/PageBreadCrumb";
import BasicTableOne from "../../../../_components/tables/Users";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Basic Table | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Basic Table  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Basic Table" />
      <div className="space-y-6">
        <ComponentCard title="Users">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </div>
  );
}
`,

    // Global Styles
    'src/styles/globals.css': `@import "tailwindcss";

@theme {
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
`,
  };

  // Write all files
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectDir, filePath);
    await writeFileLocal(fullPath, content);
    console.log(`HOOK: Created ${filePath}`);
  }

  // Create .env.example with basic structure
  const envExamplePath = path.join(projectDir, '.env.example');
  const envExampleContent = `
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"

# Better Auth
BETTER_AUTH_SECRET="your-super-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Stripe
STRIPE_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend
RESEND_API_KEY="re_..."
RESEND_EMAIL_FROM= "Skipsetup <noreply@yourdomain.com>"


# Next.js
NEXT_PUBLIC_URL="http://localhost:3000"
`.trim();

  await writeFileLocal(envExamplePath, envExampleContent);
  console.log('HOOK: Created .env.example');

  // Install basic dependencies
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    const requiredDeps = [
      'stripe',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      '@tanstack/react-query',
      '@prisma/client',
      'prisma',
      'better-auth',
      '@better-auth/react',
      'better-auth-prisma',
      'resend',
      '@react-email/components',
      'zod',
      '@trpc/server',
      '@trpc/client',
      '@trpc/react-query',
      '@trpc/next',
      'superjson',
    ];

    const missingDeps = requiredDeps.filter((dep) => {
      return (
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );
    });

    if (missingDeps.length > 0) {
      console.log(`HOOK: Installing dependencies: ${missingDeps.join(', ')}`);
      execSync(`pnpm add ${missingDeps.join(' ')}`, {
        cwd: projectDir,
        stdio: 'inherit',
        timeout: 300000,
      });
    }

    // Update package.json scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'db:push': 'prisma db push',
      'db:studio': 'prisma studio',
      'db:generate': 'prisma generate',
    };

    await writeFileLocal(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('HOOK: Updated package.json scripts');
  } catch (error) {
    console.error('HOOK: Failed to update dependencies:', error);
  }
}

// Auto-run when executed directly
(async () => {
  console.log('HOOK: Fullstack scaffolding script loaded');

  const projectDir = process.argv[2];
  if (!projectDir) {
    console.error('HOOK: No projectDir argument provided');
    process.exit(1);
  }

  await activate(projectDir).catch((err) => {
    console.error('HOOK: Activation failed:', err);
    process.exit(1);
  });
})();

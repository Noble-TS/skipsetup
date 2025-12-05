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
    // Environment Configuration
    'src/env.js': `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  // Server-side environment variables
  server: {
    BETTER_AUTH_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
  },
  
  // Client-side environment variables (prefix with NEXT_PUBLIC_)
  client: {
    // NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  
  // Runtime environment variables
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});`,
    // Prisma Schema
    'prisma/schema.prisma': `// Prisma schema for Better Auth
// learn more: https://better-auth.com/docs/concepts/database

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

// NOTE: When using mysql or sqlserver, uncomment the //@db.Text annotations in model Account below
// Further reading:
// https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#string

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

model User {
  id            String    @id
  name          String //@db.Text
  email         String
  emailVerified Boolean   @default(false)
  image         String? //@db.Text
  firstName     String? //@db.Text 
  lastName      String? //@db.Text 
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @default(now()) @updatedAt
  sessions      Session[]
  accounts      Account[]
  posts         Post[]

  @@unique([email])
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String? //@db.Text
  userAgent String? //@db.Text
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String //@db.Text
  providerId            String //@db.Text
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String? //@db.Text
  refreshToken          String? //@db.Text
  idToken               String? //@db.Text
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String? //@db.Text
  password              String? //@db.Text
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("account")
}

model Verification {
  id         String   @id
  identifier String //@db.Text
  value      String //@db.Text
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @default(now()) @updatedAt

  @@map("verification")
}
`,

    // Database Configuration
    'src/server/db.ts': `import { env } from "~/env";
import { PrismaClient } from "../../generated/prisma";

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

    // Better Auth Configuration
    'src/server/better-auth/config.ts': `import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "../../../generated/prisma/client";

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
            firstName: (user as any).firstName || user.name?.split(' ')[0] || 'User',
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
      console.log(\`Password for user \${user.email} has been reset.\`);
    },
    resetPasswordTokenExpiresIn: 60 * 60,
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
    nextCookies()
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
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
  console.log(\`[TRPC] \${path} took \${end - start}ms to execute\`);

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
    // Post Router
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
      // Use the scalar field createdById for direct assignment
      return ctx.db.post.create({
        data: {
          name: input.name,
          createdById: ctx.session.user.id,
        },
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    // For where clause, you can filter by the scalar field
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdById: ctx.session.user.id },
    });

    return post ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});`,
    // 'src/server/api/routers/payments.ts': `// Payments router placeholder`,
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

    // tRPC React Client
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
  });`,
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
    // Stripe Utilities
    // 'src/utils/stripe.ts': `// Stripe utilities placeholder`,

    // API Routes
    'src/app/api/auth/[...all]/route.ts': `import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "~/server/better-auth";

export const { GET, POST } = toNextJsHandler(auth.handler);
`,
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
    // Auth Components
    'src/app/_components/auth/SignInForm.tsx': `"use client";

import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";
import { ChevronLeft, Eye, EyeOff, Mail, Lock, KeyRound } from "lucide-react";
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

  // T3 Theme Constants
  const accentText = "text-[hsl(280,100%,70%)]";
  const inputStyles = "bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-[hsl(280,100%,70%)]/20";

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
      if (error) {
        setError(error.message ?? "Failed to send verification code");
        return;
      }
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
        setError(error.message ?? "Failed to sign in with OTP");
        return;
      }
      if (data) {
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = "/";
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
        setError(error.message ?? "Failed to sign in");
        return;
      }
      if (data) {
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = "/";
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      
      {/* Decorative Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Back Link */}
        <div className="mb-6 px-4 sm:px-0">
          <Link href="/" className="inline-flex items-center text-sm text-purple-200 hover:text-white transition-colors group">
            <ChevronLeft className="mr-1 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden">
          
          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {step === "otp" ? "Verify Code" : "Welcome Back"}
            </h2>
            <p className="mt-2 text-sm text-purple-200">
              {step === "otp" 
                ? \`Enter the code sent to \${formData.email}\` 
                : "Sign in to access your T3 dashboard"}
            </p>
          </div>

          {step === "otp" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {error && (
                <div className="p-3 text-sm rounded-lg border border-red-500/50 bg-red-500/10 text-red-200">
                  {error}
                </div>
              )}

              <div>
                <Label className="text-purple-100">Verification Code</Label>
                <Input
                  type="text"
                  name="otp"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  disabled={isLoading}
                  className={\`\${inputStyles} text-center text-2xl font-mono tracking-[0.5em] h-14\`}
                  startIcon={<KeyRound className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  variant="t3-purple"
                  size="lg"
                  onClick={verifyOtpAndSignIn}
                  disabled={isLoading || !otp}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Verify & Sign In
                </Button>

                <div className="flex justify-between items-center text-sm mt-4">
                  <button
                     type="button"
                     onClick={sendSignInOtp}
                     disabled={isSendingOtp}
                     className={\`\${accentText} hover:text-white transition-colors disabled:opacity-50\`}
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="text-purple-300 hover:text-white transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 text-sm rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              {/* Method Toggle */}
              <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-black/20 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setUseOtp(false)}
                  className={\`py-2 text-sm font-medium rounded-lg transition-all \${
                    !useOtp 
                      ? "bg-white/10 text-white shadow-sm border border-white/10" 
                      : "text-purple-300 hover:text-white"
                  }\`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setUseOtp(true)}
                  className={\`py-2 text-sm font-medium rounded-lg transition-all \${
                    useOtp 
                      ? "bg-white/10 text-white shadow-sm border border-white/10" 
                      : "text-purple-300 hover:text-white"
                  }\`}
                >
                  Email Code
                </button>
              </div>

              <form onSubmit={useOtp ? (e) => { e.preventDefault(); sendSignInOtp(); } : handleEmailPasswordSignIn} className="space-y-6">
                <div>
                  <Label className="text-purple-100">Email Address</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading || isSendingOtp}
                    className={inputStyles}
                    startIcon={<Mail className="w-4 h-4" />}
                  />
                </div>

                {!useOtp && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-purple-100">Password</Label>
                      <Link 
                        href="/forgot-password" 
                        className={\`text-xs \${accentText} hover:text-white transition-colors\`}
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
                        startIcon={<Lock className="w-4 h-4" />}
                      />
                      <button
                        type="button"
                        onClick={() => !isLoading && setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      className="border-white/30 data-[state=checked]:bg-[hsl(280,100%,70%)]"
                    />
                    <span className="ml-2 text-sm text-purple-200">Remember me</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  variant="t3-purple" 
                  size="lg" 
                  disabled={isLoading || isSendingOtp} 
                  isLoading={isLoading || isSendingOtp}
                  className="w-full"
                >
                  {useOtp ? "Send Code" : "Sign In"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative mt-8 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#1a103c] text-purple-300 rounded-full border border-white/5">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-medium text-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="opacity-90">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Google
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-purple-200">
                  Don't have an account?{" "}
                  <Link href="/signup" className={\`\${accentText} font-semibold hover:text-white transition-colors\`}>
                    Create account
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
    'src/app/_components/auth/SignUpForm.tsx': `"use client";
import Checkbox from "../form/input/Checkbox"; 
import Input from "../form/input/InputField"; 
import Label from "../form/label/Label"; 
import Button from "../ui/button/Button"; 
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
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

  const accentColor = "text-[hsl(280,100%,70%)]";
  const accentBorder = "focus:border-[hsl(280,100%,70%)]";
  const inputStyles = "w-full bg-black/20 border-white/10 text-white placeholder:text-white/30 rounded-lg focus:ring-2 focus:ring-[hsl(280,100%,70%)]/50";

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
        setError(error.message ?? "Failed to send verification code");
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
        else setError(error.message ?? "Registration failed.");
        return;
      }

      if (data && !data.user.emailVerified) await sendVerificationOtp();
      else window.location.href = "/signin";
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!otp) return setError("Enter the code");
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.signIn.emailOtp({ 
        email: formData.email, 
        otp 
      });
      if (error) return setError(error.message ?? "Verification failed");
      if (data) window.location.href = "/signin";
    } catch (err) {
      setError("Error during verification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] p-6">
      <div className="w-full max-w-md">
        
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-purple-200 hover:text-white transition-colors group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 py-8 px-6 shadow-2xl rounded-2xl sm:px-8 relative overflow-hidden">
          
          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              {step === "form" ? "Create Account" : "Verify Email"}
            </h1>
            <p className="text-purple-200">
              {step === "form" ? "Join the T3 community today" : \`Code sent to \${formData.email}\`}
            </p>
          </div>

          {step === "form" ? (
            <>
              {/* Google Button - Glassy Style */}
              <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-medium mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="opacity-90">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#1a103c] text-purple-300 rounded-full border border-white/5">
                    Or continue with email
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 mb-6 text-sm rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailPasswordSignUp} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-purple-100 text-sm font-medium">First Name</Label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={\`\${inputStyles} \${accentBorder}\`}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-purple-100 text-sm font-medium">Last Name</Label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={\`\${inputStyles} \${accentBorder}\`}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-purple-100 text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={\`\${inputStyles} \${accentBorder}\`}
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-purple-100 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={\`\${inputStyles} pr-10 \${accentBorder}\`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-200 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={isChecked} 
                    onChange={setIsChecked} 
                    className="mt-1 border-white/30 data-[state=checked]:bg-[hsl(280,100%,70%)]"
                  />
                  <span className="text-sm text-purple-200">
                    I agree to the <Link href="/terms" className={\`\${accentColor} hover:underline\`}>Terms</Link> and <Link href="/privacy" className={\`\${accentColor} hover:underline\`}>Privacy Policy</Link>.
                  </span>
                </div>

                <Button 
                  type="submit"
                  variant="t3-purple"
                  size="lg"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            </>
          ) : (
            /* OTP STEP */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {error && (
                <div className="p-3 text-sm rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
                  {error}
                </div>
              )}

              <div>
                <Label className="text-purple-100">Verification Code</Label>
                <Input
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  disabled={isLoading}
                  className="w-full text-center text-2xl font-mono tracking-[0.5em] h-14 bg-black/20 border-white/10 text-white rounded-xl focus:border-[hsl(280,100%,70%)] focus:ring-0"
                  placeholder="000000"
                />
                <p className="text-sm mt-2 text-center text-purple-300">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={verifyEmail} 
                  variant="t3-purple"
                  size="lg"
                  disabled={isLoading || !otp}
                  isLoading={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
                
                <button 
                  onClick={() => setStep("form")} 
                  disabled={isLoading}
                  className="w-full text-purple-300 hover:text-white text-sm transition-colors disabled:opacity-50"
                >
                  Change Email
                </button>
              </div>
            </div>
          )}

          {/* Sign In Link */}
          <div className="mt-8 text-center pt-6 border-t border-white/10">
            <p className="text-purple-200">
              Already have an account?{" "}
              <Link href="/signin" className={\`\${accentColor} font-semibold hover:underline\`}>
                Sign In
              </Link>
            </p>
          </div>
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

  // Get user data from auth session - FIXED: use isPending instead of isLoading
  const { data: session, isPending: isLoading } = authClient.useSession();
  const user = session?.user;

  const userName = user?.name || "User";
  const userEmail = user?.email || "No email";
  const userImage = user?.image || null;

  // Close dropdown when clicking outside or pressing escape
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

  // Get user initials for avatar fallback
  const getUserInitials = () => {
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
      {/* Toggle Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-100 transition-colors"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B0000] to-[#a50000] flex items-center justify-center text-white text-sm font-semibold">
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

        {/* User info - hidden on mobile */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-800">{userName}</div>
          <div className="text-xs text-gray-500">
            {user?.email}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={\`w-4 h-4 text-gray-500 transition-transform \${isOpen ? "rotate-180" : ""}\`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-stone-100">
            <div className="text-sm font-medium text-gray-800">{userName}</div>
            <div className="text-xs text-gray-500 truncate">{userEmail}</div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-stone-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ProfileIcon className="w-4 h-4" />
              Edit Profile
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-stone-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon className="w-4 h-4" />
              Account Settings
            </Link>

            {/* Removed admin check since role field doesn't exist */}
          </div>

          {/* Sign Out Button */}
          <div className="border-t border-stone-100 pt-2">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
import { ChevronLeft, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // T3 Theme Constants
  const accentText = "text-[hsl(280,100%,70%)]";
  const inputStyles = "bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-[hsl(280,100%,70%)]/20";

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
    <div className="min-h-screen w-full font-sans relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      
      {/* Decorative Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Back Link */}
        <div className="mb-6 px-4 sm:px-0">
          <Link href="/signin" className="inline-flex items-center text-sm text-purple-200 hover:text-white transition-colors group">
            <ChevronLeft className="mr-1 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>
        </div>

        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden">
          
          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
            <KeyRound className="mx-auto h-12 w-12 text-purple-400 mb-4" />
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {success ? "Check Your Email" : "Reset Your Password"}
            </h2>
            <p className="mt-2 text-sm text-purple-200">
              {success
                ? \`We sent a reset link to \${email}\`
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {success ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 mb-4 text-sm rounded-lg border border-green-500/50 bg-green-500/10 text-green-200">
                <p>We've sent a password reset link to <strong className="text-white">{email}</strong></p>
                <p className="mt-1">Check your inbox and click the link to reset your password.</p>
              </div>

              <Button
                variant="t3-purple"
                onClick={() => window.location.href = "/signin"}
                className="w-full"
              >
                Return to Sign In
              </Button>

              <p className="text-sm text-purple-300 mt-4">
                Didn't receive the email?{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className={\`\${accentText} font-semibold hover:text-white transition-colors\`}
                >
                  Try again
                </button>
              </p>

              {/* Spam Folder Notice */}
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-purple-300">
                  If you don't see the email in your inbox, please check your spam folder.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 text-sm rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-purple-100">Email Address</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className={inputStyles}
                    startIcon={<Mail className="w-4 h-4" />}
                  />
                  <p className="mt-2 text-xs text-purple-300">
                    Enter the email address associated with your account
                  </p>
                </div>

                <Button 
                  type="submit" 
                  variant="t3-purple" 
                  size="lg"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Send Reset Link
                </Button>
              </form>

              {/* Spam Folder Notice */}
              <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-center text-purple-300">
                  If you don't see the email in your inbox, please check your spam folder.
                </p>
              </div>

              {/* Sign In Link */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-purple-200">
                  Remember your password?{" "}
                  <Link href="/signin" className={\`\${accentText} font-semibold hover:text-white transition-colors\`}>
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
    'src/app/_components/auth/ResetPassword.tsx': `"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import { ChevronLeft, Eye, EyeOff, Lock, KeyRound, CheckCircle } from "lucide-react";
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

  const accentText = "text-[hsl(280,100%,70%)]";
  const accentHover = "hover:text-[hsl(280,100%,80%)]";
  const inputStyles = "bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-[hsl(280,100%,70%)]/20 transition-all duration-200";
  const cardBorder = "border-white/10";
  const successBorder = "border-green-500/50";
  const errorBorder = "border-red-500/50";

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
      <div className="min-h-screen w-full font-sans relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-[#2e026d] to-[#15162c]">

        {/* Enhanced Decorative Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-400/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">

          {/* Back Link */}
          <div className="mb-6 px-4 sm:px-0">
            <Link
              href="/forgot-password"
              className="inline-flex items-center text-sm text-purple-200 hover:text-white transition-all duration-200 group"
            >
              <ChevronLeft className="mr-1 w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Forgot Password
            </Link>
          </div>

          {/* Enhanced Glass Card */}
          <div className={\`bg-white/10 backdrop-blur-xl \${cardBorder} py-8 px-4 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden\`}>

            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

            <div className="text-center">
              <KeyRound className="mx-auto h-12 w-12 text-purple-400 mb-4 animate-in fade-in duration-500" />
              <h2 className="text-2xl font-bold text-white mb-2 animate-in slide-in-from-top-4 duration-500">
                Invalid Reset Link
              </h2>
              <p className="text-purple-200 mb-6 animate-in fade-in duration-500 delay-100">
                {tokenError}
              </p>

              <div className={\`p-3 mb-6 text-sm rounded-lg \${errorBorder} bg-red-500/10 text-red-200 animate-in fade-in duration-500 delay-200\`}>
                This link may have expired or is invalid
              </div>

              <Button
                variant="t3-purple"
                onClick={() => window.location.href = "/forgot-password"}
                className="w-full animate-in fade-in duration-500 delay-300"
              >
                Request New Reset Link
              </Button>

              {/* Additional Help Text */}
              <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-purple-300">
                  Reset links expire for security reasons. Request a new one to continue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-sans relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-[#2e026d] to-[#15162c]">

      {/* Enhanced Decorative Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">

        {/* Back Link */}
        <div className="mb-6 px-4 sm:px-0">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-purple-200 hover:text-white transition-all duration-200 group"
          >
            <ChevronLeft className="mr-1 w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Sign In
          </Link>
        </div>

        {/* Enhanced Glass Card */}
        <div className={\`bg-white/10 backdrop-blur-xl \${cardBorder} py-8 px-4 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden\`}>

          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
            {success ? (
              <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4 animate-in fade-in scale-110 duration-500" />
            ) : (
              <KeyRound className="mx-auto h-12 w-12 text-purple-400 mb-4 animate-in fade-in duration-500" />
            )}
            <h2 className="text-3xl font-bold tracking-tight text-white animate-in slide-in-from-top-4 duration-500">
              {success ? "Password Reset!" : "Create New Password"}
            </h2>
            <p className="mt-2 text-sm text-purple-200 animate-in fade-in duration-500 delay-100">
              {success
                ? "Your password has been successfully reset"
                : "Enter your new password below"}
            </p>
          </div>

          {success ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className={\`p-4 mb-4 text-sm rounded-lg \${successBorder} bg-green-500/10 text-green-200 animate-in fade-in duration-500\`}>
                <p className="font-medium">Your password has been successfully updated!</p>
                <p className="mt-1 text-green-300">Redirecting you to sign in...</p>
              </div>

              <Button
                variant="t3-purple"
                onClick={() => window.location.href = "/signin"}
                className="w-full animate-in fade-in duration-500 delay-200"
              >
                Sign In Now
              </Button>

              {/* Additional Success Info */}
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-purple-300">
                  You can now sign in with your new password.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className={\`mb-6 p-3 text-sm rounded-lg \${errorBorder} bg-red-500/10 text-red-200 animate-in fade-in slide-in-from-top-2 duration-300\`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="animate-in fade-in duration-500 delay-100">
                  <Label className="text-purple-100 font-medium">
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
                      startIcon={<Lock className="w-4 h-4 text-purple-300" />}
                    />
                    <button
                      type="button"
                      onClick={() => !isLoading && setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors duration-200 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-purple-300">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="animate-in fade-in duration-500 delay-200">
                  <Label className="text-purple-100 font-medium">
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
                      startIcon={<Lock className="w-4 h-4 text-purple-300" />}
                    />
                    <button
                      type="button"
                      onClick={() => !isLoading && setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors duration-200 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="t3-purple"
                  size="lg"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full animate-in fade-in duration-500 delay-300"
                >
                  Reset Password
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-center text-purple-300">
                  Choose a strong password that you haven't used before
                </p>
              </div>

              {/* Sign In Link */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center animate-in fade-in duration-500 delay-400">
                <p className="text-sm text-purple-200">
                  Remember your password?{" "}
                  <Link
                    href="/signin"
                    className={\`\${accentText} \${accentHover} font-semibold transition-colors duration-200\`}
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

    // Common Components
    'src/app/_components/common/.gitkeep': ``, // Empty file to ensure directory is created

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

  // Aqua/Mint Cyan Theme Colors
  const aquaTheme = {
    primary: '#57E3E7',    // Aqua / Mint Cyan (Bright)
    accent: '#41C1A6',     // Teal Green
    background: {
      primary: 'linear-gradient(135deg, #0A3442 0%, #083B4D 100%)',
      secondary: 'rgba(10, 52, 66, 0.9)',
      card: 'rgba(87, 227, 231, 0.1)'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E0F7FA',
      muted: '#B2EBF2',
      dim: '#80DEEA'
    },
    border: 'rgba(87, 227, 231, 0.3)'
  };

  const getEmailContent = () => {
    switch (type) {
      case 'reset-password':
        return {
          preview: 'Reset Your SKIPSETUP Password',
          title: 'Reset Your Password',
          subtitle: 'We received a request to reset your password for your SKIPSETUP account.',
          mainContent: (
            <>
              <Section className="my-[30px] p-6 rounded-xl bg-aqua-500/10 border border-aqua-500/30 backdrop-blur-sm">
                <Text
                  className="text-[18px] font-semibold mb-[15px] text-center m-0"
                  style={{ color: aquaTheme.accent }}
                >
                  Reset Your Password
                </Text>

                <Text
                  className="text-[15px] leading-[24px] mb-[20px] text-center m-0"
                  style={{ color: aquaTheme.text.secondary }}
                >
                  Click the button below to reset your password and regain access to your account.
                </Text>

                <Section className="text-center my-[25px]">
                  <EmailButton
                    href={resetUrl}
                    className="px-8 py-4 rounded-lg font-semibold text-[16px] no-underline text-center transition-colors"
                    style={{
                      background: aquaTheme.accent,
                      color: aquaTheme.text.primary
                    }}
                  >
                    Reset Password
                  </EmailButton>
                </Section>

                <Text
                  className="text-[13px] text-center m-0 mb-3"
                  style={{ color: aquaTheme.text.muted }}
                >
                  Or copy and paste this link in your browser:
                </Text>

                <Text
                  className="text-[12px] text-center break-all m-0 p-3 bg-aqua-500/10 rounded border border-aqua-500/20 font-mono"
                  style={{ color: aquaTheme.primary }}
                >
                  {resetUrl}
                </Text>

                <Text
                  className="text-[13px] italic text-center mt-4 m-0"
                  style={{ color: aquaTheme.text.muted }}
                >
                  This link will expire in 1 hour for security reasons.
                </Text>
              </Section>

              <Text
                className="text-[14px] leading-[22px] text-center my-[20px] m-0"
                style={{ color: aquaTheme.text.secondary }}
              >
                If you didn't request this password reset, please ignore this email.
                Your account remains secure.
              </Text>
            </>
          )
        };

      case 'otp':
        return {
          preview: 'Verify Your SKIPSETUP Account',
          title: 'Verify Your Email Address',
          subtitle: 'Welcome to SKIPSETUP! Please verify your email to get started.',
          mainContent: (
            <>
              <Section className="my-[30px] p-6 rounded-xl bg-aqua-500/10 border border-aqua-500/30 backdrop-blur-sm">
                <Text
                  className="text-[18px] font-semibold mb-[15px] text-center m-0"
                  style={{ color: aquaTheme.accent }}
                >
                  Verify Your Email Address
                </Text>

                <Text
                  className="text-[15px] leading-[24px] mb-[20px] text-center m-0"
                  style={{ color: aquaTheme.text.secondary }}
                >
                  Please use the following verification code to complete your account setup.
                </Text>

                <Section className="text-center my-[25px]">
                  <Text
                    className="text-[14px] font-medium mb-[10px] m-0"
                    style={{ color: aquaTheme.text.secondary }}
                  >
                    Your Verification Code
                  </Text>

                  <Text
                    className="text-[42px] font-bold tracking-widest my-[15px] mx-0 font-mono"
                    style={{ color: aquaTheme.primary }}
                  >
                    {verificationCode}
                  </Text>

                  <Text
                    className="text-[13px] italic m-0"
                    style={{ color: aquaTheme.text.muted }}
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
          preview: 'Welcome to SKIPSETUP',
          title: 'Welcome to SKIPSETUP!',
          subtitle: 'Your production-ready fullstack foundation is ready.',
          mainContent: (
            <>
              <Text
                className="text-[16px] leading-[26px] mb-[20px] text-center"
                style={{ color: aquaTheme.text.secondary }}
              >
                Get ready to build faster with type-safe, zero-config scaffolding and AI-powered development.
              </Text>

              {/* Features Highlight */}
              <Section className="grid grid-cols-1 gap-4 my-[30px]">
                <Section className="flex items-center gap-4 p-4 bg-aqua-500/10 rounded-lg border border-aqua-500/30 backdrop-blur-sm">
                  <Text
                    className="text-[36px] m-0"
                    style={{ color: aquaTheme.primary }}
                  >
                    ⚡
                  </Text>
                  <Section>
                    <Text
                      className="text-[16px] font-semibold m-0 mb-1"
                      style={{ color: aquaTheme.text.primary }}
                    >
                      Zero-Config Setup
                    </Text>
                    <Text
                      className="text-[14px] m-0"
                      style={{ color: aquaTheme.text.secondary }}
                    >
                      Production-ready foundations in one command
                    </Text>
                  </Section>
                </Section>

                <Section className="flex items-center gap-4 p-4 bg-aqua-500/10 rounded-lg border border-aqua-500/30 backdrop-blur-sm">
                  <Text
                    className="text-[36px] m-0"
                    style={{ color: aquaTheme.accent }}
                  >
                    🤖
                  </Text>
                  <Section>
                    <Text
                      className="text-[16px] font-semibold m-0 mb-1"
                      style={{ color: aquaTheme.text.primary }}
                    >
                      AI-Powered Development
                    </Text>
                    <Text
                      className="text-[14px] m-0"
                      style={{ color: aquaTheme.text.secondary }}
                    >
                      Build features faster with constrained AI
                    </Text>
                  </Section>
                </Section>

                <Section className="flex items-center gap-4 p-4 bg-aqua-500/10 rounded-lg border border-aqua-500/30 backdrop-blur-sm">
                  <Text
                    className="text-[36px] m-0"
                    style={{ color: aquaTheme.primary }}
                  >
                    🔧
                  </Text>
                  <Section>
                    <Text
                      className="text-[16px] font-semibold m-0 mb-1"
                      style={{ color: aquaTheme.text.primary }}
                    >
                      Integrated Plugins
                    </Text>
                    <Text
                      className="text-[14px] m-0"
                      style={{ color: aquaTheme.text.secondary }}
                    >
                      Stripe, Auth, Database & more - ready to use
                    </Text>
                  </Section>
                </Section>
              </Section>

              {/* Call to Action */}
              <Section className="text-center mt-[30px]">
                <Text
                  className="text-[16px] font-semibold mb-[15px] m-0"
                  style={{ color: aquaTheme.text.primary }}
                >
                  Ready to start building?
                </Text>
                <EmailButton
                  href={\`\${baseUrl}/dashboard\`}
                  className="px-8 py-3 rounded-lg font-semibold text-[16px] no-underline text-center transition-colors"
                  style={{
                    background: aquaTheme.primary,
                    color: aquaTheme.text.primary
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
        <Body className="font-sans text-white" style={{ background: aquaTheme.background.primary }}>
          <Preview>{emailContent.preview}</Preview>
          <Container className="p-5 mx-auto">
            {/* Header Section with KIPSETUP Styling */}
            <Section className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-aqua-500/30" style={{ background: aquaTheme.background.secondary }}>

              {/* Gradient Header */}
              <Section
                className="flex flex-col items-center justify-center py-12 relative overflow-hidden min-h-[200px]"
                style={{
                  background: \`linear-gradient(135deg, \${aquaTheme.primary} 0%, \${aquaTheme.accent} 100%)\`
                }}
              >
                {/* Subtle Pattern Overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: \`radial-gradient(circle at 25% 25%, white 1px, transparent 1px)\`,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Centered Content Container */}
                <Section className="flex flex-col items-center justify-center space-y-4 relative z-10 w-full max-w-md mx-auto">
                  {/* Large S Logo */}
                  <Section className="flex items-center justify-center mb-2">
                    <Img
                      src="https://raw.githubusercontent.com/Noble-TS/skipsetup/master/logo-skip.png"
                      width="120"
                      height="40"
                      alt="SkipSetup Logo"
                      className="mx-auto"
                    />
                  </Section>

                  {/* KIPSETUP Brand Name */}
                  <Heading
                    className="text-white text-[32px] font-bold tracking-tight text-center w-full m-0"
                    style={{ color: '#FFFFFF' }}
                  >
                    SKIPSETUP
                  </Heading>

                  {/* Tagline */}
                  <Text
                    className="text-white/80 text-[14px] font-light text-center w-full m-0"
                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                  >
                    Production-Ready Fullstack Foundations
                  </Text>
                </Section>
              </Section>

              {/* Main Content */}
              <Section className="py-[30px] px-[35px] bg-transparent">
                <Heading
                  className="text-[28px] font-bold mb-[20px] text-center tracking-tight"
                  style={{ color: aquaTheme.text.primary }}
                >
                  {emailContent.title}
                </Heading>

                <Text
                  className="text-[16px] leading-[26px] mb-[20px] text-center font-light"
                  style={{ color: aquaTheme.text.secondary }}
                >
                  {emailContent.subtitle}
                </Text>

                {emailContent.mainContent}
              </Section>

              <Hr style={{ borderColor: aquaTheme.border }} />

              {/* Security Notice */}
              <Section className="py-[25px] px-[35px] bg-aqua-500/10 backdrop-blur-sm">
                <Text
                  className="text-[14px] leading-[20px] text-center m-0 font-light"
                  style={{ color: aquaTheme.text.muted }}
                >
                  <strong style={{ color: aquaTheme.text.primary }}>Security Notice:</strong> SKIPSETUP will never email you
                  and ask you to disclose or verify your password, credit card,
                  or banking account number.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="mt-[20px] text-center">
              <Text
                className="text-[12px] leading-[18px] m-0 mb-2 font-light"
                style={{ color: aquaTheme.text.muted }}
              >
                Build faster with production-ready foundations and AI-powered development.
              </Text>

              <Text
                className="text-[11px] leading-[16px] m-0 font-light"
                style={{ color: aquaTheme.text.dim }}
              >
                © {new Date().getFullYear()} SKIPSETUP. All rights reserved.{' '}
                <Link
                  href={\`\${baseUrl}/terms\`}
                  className="underline font-normal"
                  style={{ color: aquaTheme.primary }}
                >
                  Terms & Conditions
                </Link>{' '}
                •{' '}
                <Link
                  href={\`\${baseUrl}/privacy\`}
                  className="underline font-normal"
                  style={{ color: aquaTheme.primary }}
                >
                  Privacy Policy
                </Link>
              </Text>

              {/* Brand Tagline */}
              <Text
                className="text-[13px] italic mt-4 mb-2 m-0 font-light"
                style={{ color: aquaTheme.primary }}
              >
                "Zero-Config, Production-Ready"
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
            "border-gray-300 bg-white checked:bg-brand-600 checked:border-transparent",
            // Dark Mode / Glass Defaults
            "dark:border-white/20 dark:bg-black/20 dark:checked:bg-[hsl(280,100%,70%)]",
            // Hover states
            !disabled && "group-hover:border-brand-400 dark:group-hover:border-[hsl(280,100%,70%)]",
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
            className="text-white dark:text-[#2e026d]" 
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
  label?: string; // Optional built-in label support
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
    ? "border-green-500 text-green-900 placeholder:text-green-300 focus:ring-2 focus:ring-green-500/20 bg-green-50/50 dark:bg-green-900/10 dark:text-green-200 dark:border-green-500/50"
    : "border-gray-200 bg-white text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-[hsl(280,100%,70%)] dark:focus:ring-[hsl(280,100%,70%)]/20";

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
            error ? "text-red-500" : success ? "text-green-500" : "text-gray-500 dark:text-gray-400"
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
        // Default Colors (Light/Dark)
        "text-gray-700 dark:text-gray-300",
        // Allow overriding
        className
      )}
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
};

export default Label;`,
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

    // Layout and Pages
    'src/app/layout.tsx': `import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

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
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}`,
    'src/app/page.tsx': `import Link from "next/link";
import { redirect } from "next/navigation";
import { LatestPost } from "~/app/_components/post";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/better-auth/config";
import { headers } from "next/headers";
export default async function Home() {
  const session = await getSession();
  if (session) void api.post.getLatest.prefetch();
  const hello = await api.post.hello({ text: "from tRPC" });

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Welcome to <span className="text-[hsl(280,100%,70%)]">T3</span> App
          </h1>

          <p className="text-2xl text-white">
            {hello ? hello.greeting : "Loading tRPC query..."}
          </p>

          {!session ? (
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg flex flex-col gap-6">

              <Link
                href="/signin"
                className="w-full rounded-xl bg-white/20 py-3 text-center font-semibold 
                 hover:bg-white/30 transition shadow-md"
              >
                Sign In
              </Link>

              <div className="w-full h-px bg-white/20" />

              <div className="text-center text-lg text-purple-200">
                <span>New here? </span>
                <Link
                  href="/signup"
                  className="underline font-semibold hover:text-white transition"
                >
                  Create an account
                </Link>
              </div>

              {/* Forgot Password */}
              <div className="text-center text-purple-200">
                <Link
                  href="/forgot-password"
                  className="underline text-sm hover:text-white transition"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xl">Logged in as {session.user?.email}</p>

              <form>
                <button
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
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

              <LatestPost />
            </>
          )}

        </div>
      </main>
    </HydrateClient>
  );
}
`,

    // Auth Pages
    'src/app/(auth)/layout.tsx': `"use client";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white overflow-hidden">
      <div className="flex min-h-screen w-full lg:flex-row flex-col">

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-lg">
            {children}
          </div>
        </div>

        <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 overflow-hidden bg-black/20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[hsl(280,100%,70%)]/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg space-y-8">
            <Link href="/" className="group">
              <h1 className="text-6xl font-extrabold tracking-tight">
                <span className="text-[hsl(280,100%,70%)] group-hover:brightness-110 transition-all">T3</span> Auth
              </h1>
            </Link>

            <p className="text-2xl text-purple-200 font-light">
              The best way to start your full-stack, typesafe application.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {['Next.js', 'Better-Auth', 'Tailwind', 'tRPC'].map((tech) => (
                <span key={tech} className="px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-sm font-semibold text-purple-100 shadow-lg">
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
}`,
    'src/app/(auth)/signup/page.tsx': `import SignUpForm from "~/app/_components/auth/SignUpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
};

export default function SignUp() {
  return <SignUpForm />;
}`,
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

  // Create empty directories that don't have files yet
  const emptyDirectories = ['src/app/_components/common'];

  for (const dir of emptyDirectories) {
    const fullPath = path.join(projectDir, dir);
    await fs.mkdir(fullPath, { recursive: true });
    console.log(`HOOK: Created directory ${dir}`);
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

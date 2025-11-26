// packages/plugins-stripe/src/hooks/activate.ts
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
  console.log('HOOK: Running Stripe plugin activation...');
  const fullDir = path.resolve(projectDir);

  try {
    // 1️⃣ Check package.json and install dependencies
    const packageJsonPath = path.join(fullDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    const requiredDeps = [
      'stripe@^16.12.0',
      '@stripe/stripe-js@^4.10.0', // Add this missing dependency
      '@stripe/react-stripe-js@^2.8.1',
      '@tanstack/react-query@^5.90.5',
    ];
    const missingDeps = requiredDeps.filter((dep) => {
      const base = dep.split('@')[0]!;
      return !packageJson.dependencies?.[base];
    });

    if (missingDeps.length > 0) {
      console.log(
        `HOOK: Installing missing dependencies: ${missingDeps.join(', ')}`
      );
      execSync(`pnpm add ${missingDeps.join(' ')}`, {
        cwd: fullDir,
        stdio: 'inherit',
        timeout: 300000,
      });
    }

    // 2️⃣ Create files that match your exact structure
    await createStripeFiles(fullDir);

    console.log('✅ HOOK: Stripe plugin activated fully!');
  } catch (error) {
    console.error('❌ HOOK: Activation failed:', error);
    throw error;
  }
}

async function createStripeFiles(projectDir: string) {
  const files = {
    // Stripe utility (server-side)
    'src/utils/stripe.ts': `
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY || '', {
  apiVersion: '2024-06-20',
});

export default stripe;

export const verifyWebhook = (sig: string | string[] | undefined, payload: Buffer) => {
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing signature or secret');
  return stripe.webhooks.constructEvent(payload, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
};
`.trim(),

    // Payments router (tRPC) - FIXED version
    'src/server/api/routers/payments.ts': `
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc';
import stripe from '~/utils/stripe';

export const paymentsRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(z.object({ 
      priceId: z.string(),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl || \`\${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}\`,
        cancel_url: input.cancelUrl || \`\${process.env.NEXT_PUBLIC_URL}\`,
        metadata: { userId: ctx.user?.id ?? '' },
      };
      
      const session = await stripe.checkout.sessions.create(sessionParams);
      return { sessionId: session.id, url: session.url };
    }),

  createConnectedAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: ctx.user?.email ?? '',
      });
      return { accountId: account.id };
    }),

  transferToAccount: protectedProcedure
    .input(z.object({ amount: z.number(), accountId: z.string() }))
    .mutation(async ({ input }) => {
      const transfer = await stripe.transfers.create({
        amount: input.amount,
        currency: 'usd',
        destination: input.accountId,
      });
      return { transferId: transfer.id };
    }),

  verifyWebhook: publicProcedure
    .input(z.object({ sig: z.string(), payload: z.string() }))
    .mutation(async ({ input }) => {
      const payloadBuffer = Buffer.from(input.payload, 'utf8');
      return stripe.webhooks.constructEvent(payloadBuffer, input.sig, process.env.STRIPE_WEBHOOK_SECRET!);
    }),
});
`.trim(),

    // React hook for payments
    'src/hooks/usePayments.ts': `
import { api } from "~/utils/api";

export function usePayments() {
  const createCheckoutSession = api.payments.createCheckoutSession.useMutation();
  const createConnectedAccount = api.payments.createConnectedAccount.useMutation();
  const transferToAccount = api.payments.transferToAccount.useMutation();
  const verifyWebhook = api.payments.verifyWebhook.useMutation();

  return {
    createCheckoutSession,
    createConnectedAccount,
    transferToAccount,
    verifyWebhook,
  };
}
`.trim(),

    // Checkout API route (App Router)
    'src/app/api/checkout/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import stripe from '~/utils/stripe';

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: \`\${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_URL}\`,
      metadata: { userId },
    });
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
`.trim(),

    // Stripe webhook handler (App Router) - FIXED version
    'src/app/api/stripe/webhook/route.ts': `
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '~/utils/stripe';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  
  try {
    const event = verifyWebhook(sig, Buffer.from(body));
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        // Handle successful payment - update database, send email, etc.
        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }
}
`.trim(),

    // Success page (App Router)
    'src/app/checkout/success/page.tsx': `
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p>Thank you for your purchase. Your order is being processed.</p>
        </div>
        
        {sessionId && (
          <p className="text-sm text-gray-600">
            Order ID: {sessionId}
          </p>
        )}
        
        <button 
          onClick={() => router.push('/')}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
`.trim(),

    // Checkout button component - FIXED version
    'src/app/_components/checkout/CheckoutButton.tsx': `
"use client";

import { loadStripe } from '@stripe/stripe-js';
import { usePayments } from '~/hooks/usePayments';

// This will be set by the environment variable
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface CheckoutButtonProps {
  priceId: string;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function CheckoutButton({ 
  priceId, 
  children, 
  className = "bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700",
  onSuccess,
  onError 
}: CheckoutButtonProps) {
  const { createCheckoutSession } = usePayments();

  const handleCheckout = async () => {
    try {
      const result = await createCheckoutSession.mutateAsync({
        priceId,
        successUrl: \`\${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}\`,
        cancelUrl: window.location.href,
      });

      if (result.url) {
        window.location.href = result.url;
      } else if (result.sessionId && stripePromise) {
        const stripe = await stripePromise;
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: result.sessionId });
        }
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Checkout failed:', error);
      onError?.(error);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={createCheckoutSession.isPending}
      className={\`\${className} \${createCheckoutSession.isPending ? 'opacity-50 cursor-not-allowed' : ''}\`}
    >
      {createCheckoutSession.isPending ? 'Processing...' : children}
    </button>
  );
}
`.trim(),
  };

  // Write all files
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectDir, filePath);
    await writeFileLocal(fullPath, content);
    console.log(`HOOK: Created ${filePath}`);
  }

  // Update root router to include both post and payments
  const rootRouterPath = path.join(projectDir, 'src/server/api/root.ts');

  try {
    // Create a properly formatted root router that includes both routers
    const rootRouterContent = `import { createTRPCRouter } from '~/server/api/trpc';
import { postRouter } from './routers/post';
import { paymentsRouter } from './routers/payments';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  payments: paymentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
`;

    await writeFileLocal(rootRouterPath, rootRouterContent);
    console.log(
      'HOOK: Successfully created root router with both post and payments'
    );
  } catch (error) {
    console.error('HOOK: Failed to update root router:', error);
  }

  // Fix the tRPC context issue by updating the trpc.ts file
  const trpcConfigPath = path.join(projectDir, 'src/server/api/trpc.ts');
  try {
    const trpcContent = await fs.readFile(trpcConfigPath, 'utf8');

    // Check if createTRPCContext is already defined
    if (!trpcContent.includes('createTRPCContext')) {
      console.log('HOOK: Adding createTRPCContext to trpc config');

      // Add the context creation function
      const updatedTrpcContent = trpcContent.replace(
        /export const createTRPCContext[^}]*}/s,
        `/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
export const createTRPCContext = async (opts: { 
  headers: Headers;
  user?: { id: string; email: string };
}) => {
  return {
    ...opts,
  };
};`
      );

      await writeFileLocal(trpcConfigPath, updatedTrpcContent);
    }
  } catch (error) {
    console.error('HOOK: Could not update trpc config:', error);
  }

  // Update .env.example
  const envPath = path.join(projectDir, '.env.example');
  const envContent = `
# Stripe Configuration
STRIPE_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_URL=http://localhost:3000
`.trim();

  await writeFileLocal(envPath, envContent, { append: true });
  console.log('HOOK: Updated .env.example with Stripe variables');
}

// Auto-run when executed directly
(async () => {
  console.log('HOOK: Script loaded successfully');

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

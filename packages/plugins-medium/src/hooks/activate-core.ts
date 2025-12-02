// packages/plugins-stripe/src/hooks/activate-core.ts
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export async function writeFileLocal(
  fullPath: string,
  content: string,
  options?: { append?: boolean }
) {
  console.log(
    `HOOK: Writing file ${fullPath} (append=${options?.append || false})`
  );
  try {
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    if (options?.append) {
      const existing = await fs.readFile(fullPath, 'utf8').catch(() => '');
      content = existing + content;
    }
    await fs.writeFile(fullPath, content, 'utf8');
    console.log(`✅ HOOK: Successfully wrote ${fullPath}`);
  } catch (err) {
    console.error(`❌ HOOK: Failed to write ${fullPath}:`, err);
    throw err;
  }
}

export async function activate(projectDir: string) {
  console.log('🚀 HOOK: Activating Stripe plugin...');
  const fullDir = path.resolve(projectDir);

  try {
    const packageJsonPath = path.join(fullDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    // 1️⃣ Install missing dependencies
    const requiredDeps = [
      'stripe@^16.12.0',
      '@stripe/react-stripe-js@^2.8.1',
      '@tanstack/react-query@^5.90.5',
    ];
    const missingDeps = requiredDeps.filter((dep) => {
      const base = dep.split('@')[0];
      return !packageJson.dependencies?.[base];
    });

    if (missingDeps.length > 0) {
      console.log(`HOOK: Installing missing deps: ${missingDeps.join(', ')}`);
      execSync(`pnpm add ${missingDeps.join(' ')}`, {
        cwd: fullDir,
        stdio: 'inherit',
      });
    }

    // 2️⃣ Ensure dirs
    const utilsDir = path.join(fullDir, 'src/utils');
    const routersDir = path.join(fullDir, 'src/server/api/routers');
    const hooksDir = path.join(fullDir, 'src/hooks');
    await Promise.all([
      fs.mkdir(utilsDir, { recursive: true }),
      fs.mkdir(routersDir, { recursive: true }),
      fs.mkdir(hooksDir, { recursive: true }),
    ]);

    // 3️⃣ Stripe util
    const utilsPath = path.join(utilsDir, 'stripe.ts');
    const stripeUtil = `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY || '', {
  apiVersion: '2024-06-20',
});

export default stripe;

export const verifyWebhook = (sig: string | string[] | undefined, payload: Buffer) => {
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing signature or secret');
  return stripe.webhooks.constructEvent(payload, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
};
`;
    await writeFileLocal(utilsPath, stripeUtil);

    // 4️⃣ Payments router
    const routerPath = path.join(routersDir, 'payments.ts');
    const routerContent = `import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc';
import stripe, { verifyWebhook } from '~/utils/stripe';

export const paymentsRouter = createTRPCRouter({
  createSession: protectedProcedure.input(z.object({ priceId: z.string() })).mutation(async ({ input, ctx }) => {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: \`\${process.env.NEXT_PUBLIC_URL}/success\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_URL}/cancel\`,
      metadata: { userId: ctx.user?.id },
    });
    return { url: session.url };
  }),
  createConnectedAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const account = await stripe.accounts.create({ type: 'express', country: 'US', email: ctx.user?.email });
    return { accountId: account.id };
  }),
  transferToAccount: protectedProcedure.input(z.object({ amount: z.number(), accountId: z.string() })).mutation(async ({ input }) => {
    const transfer = await stripe.transfers.create({
      amount: input.amount,
      currency: 'usd',
      destination: input.accountId,
    });
    return { transferId: transfer.id };
  }),
  verifyWebhook: publicProcedure.input(z.object({ sig: z.string(), payload: z.string() })).mutation(async ({ input }) => {
    const payloadBuffer = Buffer.from(input.payload, 'utf8');
    return verifyWebhook(input.sig, payloadBuffer);
  }),
});
`;
    await writeFileLocal(routerPath, routerContent);

    // 5️⃣ Root router
    const rootRouterPath = path.join(fullDir, 'src/server/api/root.ts');
    const rootExists = await fs
      .access(rootRouterPath)
      .then(() => true)
      .catch(() => false);
    if (rootExists) {
      let rootContent = await fs.readFile(rootRouterPath, 'utf8');
      if (!rootContent.includes('payments: paymentsRouter')) {
        rootContent =
          `import { paymentsRouter } from './routers/payments';\n` +
          rootContent;
        rootContent = rootContent.replace(
          'export const appRouter = createTRPCRouter({',
          'export const appRouter = createTRPCRouter({\n  payments: paymentsRouter,'
        );
        await writeFileLocal(rootRouterPath, rootContent);
      }
    } else {
      const rootRouterContent = `import { createTRPCRouter } from '~/server/api/trpc';
import { paymentsRouter } from './routers/payments';

export const appRouter = createTRPCRouter({
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
`;
      await writeFileLocal(rootRouterPath, rootRouterContent);
    }

    // 6️⃣ Client hook
    const hookPath = path.join(hooksDir, 'usePayments.ts');
    const hookContent = `import { api } from '~/utils/api';

export function usePayments() {
  const createSession = api.payments.createSession.useMutation();
  const createConnectedAccount = api.payments.createConnectedAccount.useMutation();
  const transferToAccount = api.payments.transferToAccount.useMutation();
  const verifyWebhook = api.payments.verifyWebhook.useMutation();

  return { createSession, createConnectedAccount, transferToAccount, verifyWebhook };
}
`;
    await writeFileLocal(hookPath, hookContent);

    // 7️⃣ .env.example
    const envPath = path.join(fullDir, '.env.example');
    const envContent = `
# Stripe Plugin
STRIPE_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_URL=http://localhost:3000
`;
    await writeFileLocal(envPath, envContent, { append: true });

    console.log('✅ HOOK: Stripe plugin activated!');
  } catch (err) {
    console.error('❌ HOOK: Activation failed:', err);
    throw err;
  }
}

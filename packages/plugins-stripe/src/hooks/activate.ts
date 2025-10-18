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

async function activate(projectDir: string) {
  console.log('HOOK: Running activation...');
  const fullDir = path.resolve(projectDir);
  console.log('HOOK EXECUTED: Activating @forge/plugin-stripe in', fullDir);

  try {
    // 1️⃣ Check package.json
    const packageJsonPath = path.join(fullDir, 'package.json');
    console.log(`HOOK: Reading package.json from ${packageJsonPath}`);
    let packageJson;
    try {
      packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    } catch (error) {
      console.error('HOOK: Failed to read package.json:', error);
      throw error;
    }

    // 2️⃣ Install missing dependencies
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
      console.log(
        `HOOK: Installing missing dependencies: ${missingDeps.join(', ')}`
      );
      try {
        execSync(`pnpm add ${missingDeps.join(' ')}`, {
          cwd: fullDir,
          stdio: 'inherit',
          timeout: 300000,
        });
        console.log('HOOK: Installed missing dependencies');
      } catch (error) {
        console.error('HOOK: Dependency install failed:', error);
        throw error;
      }
    } else {
      console.log('HOOK: All required dependencies already installed');
    }

    // 3️⃣ Ensure directory structure
    const utilsDir = path.join(fullDir, 'src/utils');
    const routersDir = path.join(fullDir, 'src/server/api/routers');
    const hooksDir = path.join(fullDir, 'src/hooks');
    console.log(
      `HOOK: Creating directories: ${utilsDir}, ${routersDir}, ${hooksDir}`
    );
    await fs.mkdir(utilsDir, { recursive: true });
    await fs.mkdir(routersDir, { recursive: true });
    await fs.mkdir(hooksDir, { recursive: true });

    // 4️⃣ Inject Stripe utility
    const utilsPath = path.join(utilsDir, 'stripe.ts');
    const stripeContent = `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY || '', {
  apiVersion: '2024-06-20',
});

export default stripe;

export const verifyWebhook = (sig: string | string[] | undefined, payload: Buffer) => {
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing signature or secret');
  return stripe.webhooks.constructEvent(payload, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
};
`;
    await writeFileLocal(utilsPath, stripeContent);
    console.log('HOOK: Injected src/utils/stripe.ts');

    // 5️⃣ Inject payments router (server-side)
    const routerPath = path.join(routersDir, 'payments.ts');
    const routerContent = `import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '~/server/api/trpc';
import stripe from '~/utils/stripe';

export const paymentsRouter = createTRPCRouter({
  createSession: protectedProcedure
    .input(z.object({ priceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
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
  createConnectedAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: ctx.user?.email,
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
      return stripe.verifyWebhook(input.sig, payloadBuffer);
    }),
});
`;
    await writeFileLocal(routerPath, routerContent);
    console.log('HOOK: Injected src/server/api/routers/payments.ts');

    // 6️⃣ Merge with root router
    const rootRouterPath = path.join(fullDir, 'src/server/api/root.ts');
    console.log(`HOOK: Checking root router at ${rootRouterPath}`);
    const rootExists = await fs
      .access(rootRouterPath)
      .then(() => true)
      .catch(() => false);
    if (rootExists) {
      let rootContent = await fs.readFile(rootRouterPath, 'utf8');
      if (!rootContent.includes('payments: paymentsRouter')) {
        console.log('HOOK: Merging payments into root router');
        rootContent = rootContent.replace(
          'export const appRouter = createTRPCRouter({',
          'export const appRouter = createTRPCRouter({\n  payments: paymentsRouter,'
        );
        await writeFileLocal(rootRouterPath, rootContent);
      } else {
        console.log('HOOK: Payments router already merged');
      }
    } else {
      console.warn('HOOK: Root router not found, creating new');
      const rootRouterContent = `import { createTRPCRouter } from '~/server/api/trpc';
import { paymentsRouter } from './routers/payments';

export const appRouter = createTRPCRouter({
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
`;
      await writeFileLocal(rootRouterPath, rootRouterContent);
    }

    // 7️⃣ Inject usePayments hook (client)
    const hooksPath = path.join(hooksDir, 'usePayments.ts');
    const hookContent = `import { api } from "~/utils/api";

export function usePayments() {
  const createSession = api.payments.createSession.useMutation();
  const createConnectedAccount = api.payments.createConnectedAccount.useMutation();
  const transferToAccount = api.payments.transferToAccount.useMutation();
  const verifyWebhook = api.payments.verifyWebhook.useMutation();

  return {
    createSession,
    createConnectedAccount,
    transferToAccount,
    verifyWebhook,
  };
}
`;
    await writeFileLocal(hooksPath, hookContent);
    console.log('HOOK: Injected src/hooks/usePayments.ts');

    // 8️⃣ Append .env.example entries
    const envPath = path.join(fullDir, '.env.example');
    const envContent = `
# Stripe Plugin
STRIPE_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
`;
    await writeFileLocal(envPath, envContent, { append: true });
    console.log('HOOK: Appended to .env.example');

    console.log('✅ HOOK: Stripe plugin activated fully!');
  } catch (error) {
    console.error('❌ HOOK: Activation failed:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// Run automatically when executed directly (like the minimal version)
// ----------------------------------------------------------------------
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

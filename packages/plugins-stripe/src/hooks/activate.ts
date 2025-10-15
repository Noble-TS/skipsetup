import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Local writeFile - no core dependencies
async function writeFileLocal(
  fullPath: string,
  content: string,
  options?: { append?: boolean }
): Promise<void> {
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  if (options?.append) {
    const existing = await fs.readFile(fullPath, 'utf8').catch(() => '');
    content = existing + content;
  }
  await fs.writeFile(fullPath, content, 'utf8');
}

(async () => {
  console.log('HOOK: Script loaded successfully'); // First log - prove import ok

  const projectDir = process.argv[2];
  if (!projectDir) {
    console.error('HOOK: No projectDir arg');
    process.exit(1);
  }

  const fullDir = path.resolve(projectDir);
  console.log('HOOK EXECUTED: Activating @forge/plugin-stripe in', fullDir);

  // Install stripe
  try {
    execSync('pnpm add stripe@^16.12.0', { cwd: fullDir, stdio: 'inherit' });
    console.log('HOOK: Installed stripe runtime');
  } catch (e) {
    console.log('HOOK: Stripe install failed or skipped:', e);
  }

  // Inject stripe.ts
  const utilsPath = path.join(fullDir, 'src/utils/stripe.ts');
  const stripeContent = `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY || '', {
  apiVersion: '2024-06-20',
});

export default stripe;

export const verifyWebhook = (sig: string | string[] | undefined, payload: Buffer) => {
  if (!sig) throw new Error("No signature");
  return stripe.webhooks.constructEvent(payload, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
};
`;
  try {
    await writeFileLocal(utilsPath, stripeContent);
    console.log('HOOK: Injected src/utils/stripe.ts at', utilsPath);
  } catch (e) {
    console.error('HOOK: Failed to write stripe.ts:', e);
    process.exit(1);
  }

  // Append env
  const envPath = path.join(fullDir, '.env.example');
  const envContent =
    '\n# Stripe Plugin\nSTRIPE_KEY=sk_test_...\nSTRIPE_WEBHOOK_SECRET=whsec_...\n';
  try {
    await writeFileLocal(envPath, envContent, { append: true });
    console.log('HOOK: Appended to .env.example at', envPath);
  } catch (e) {
    console.error('HOOK: Failed to append env:', e);
    process.exit(1);
  }

  console.log('HOOK: Stripe plugin activated fully!');
})();

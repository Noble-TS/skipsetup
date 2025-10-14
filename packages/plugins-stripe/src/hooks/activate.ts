import { execSync } from "child_process";
import path from "path";
import { writeFile } from "@forge/core/utils/file";  // Core shared

export async function activate(projectDir: string): Promise<void> {
  const fullDir = path.resolve(projectDir);
  console.log("Activating @forge/plugin-stripe...");
  
  // Add dep if not present
  try {
    execSync("pnpm add stripe", { cwd: fullDir, stdio: "inherit" });
  } catch {
    console.log("Stripe already installed or error.");
  }
  
  // Write Stripe utils
  const utilsPath = path.join(fullDir, "src/utils/stripe.ts");
  await writeFile(utilsPath, `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY || '', {
  apiVersion: '2024-06-20',
});

export default stripe;

export const verifyWebhook = (sig: string | string[] | undefined, payload: Buffer) => {
  if (!sig) throw new Error("No signature");
  return stripe.webhooks.constructEvent(payload, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
};
`);
  
  // Env stubs
  const envPath = path.join(fullDir, ".env.example");
  const envContent = "STRIPE_KEY=sk_test_...\nSTRIPE_WEBHOOK_SECRET=whsec_...\n";
  await writeFile(envPath, envContent, { append: true });
  
  console.log("Stripe plugin activated. Set secrets via forge secrets set STRIPE_KEY sk_... and STRIPE_WEBHOOK_SECRET whsec_...");
}
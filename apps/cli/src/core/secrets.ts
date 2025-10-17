import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Buffer } from 'buffer'; // Add this import

const SECRETS_PATH = path.join('.forge', 'secrets.json.enc');
const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(
  process.env.FORGE_ENCRYPT_KEY ||
    'fallback-32-byte-key-for-dev-only!!'.padEnd(32, '!')
).slice(0, 32);

export async function setSecret(key: string, value: string): Promise<void> {
  const secrets = await getSecrets();
  secrets[key] = value;
  await encryptAndSave(secrets);
}

export async function getSecrets(): Promise<Record<string, string>> {
  try {
    const data = await fs.readFile(SECRETS_PATH, 'utf8');
    const { iv, content } = JSON.parse(data);
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(iv, 'hex')
    );
    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

export async function injectSecrets(): Promise<void> {
  const secrets = await getSecrets();
  Object.entries(secrets).forEach(([k, v]) => (process.env[k] = v));
}

async function encryptAndSave(secrets: Record<string, string>): Promise<void> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(JSON.stringify(secrets), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  await fs.mkdir(path.dirname(SECRETS_PATH), { recursive: true });
  await fs.writeFile(
    SECRETS_PATH,
    JSON.stringify({ iv: iv.toString('hex'), content: encrypted })
  );
}

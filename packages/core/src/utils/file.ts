import fs from 'fs/promises';
import path from 'path';

export async function writeFile(
  dir: string,
  filename: string,
  content: string
): Promise<void> {
  const fullPath = path.join(dir, filename);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

export async function appendToFile(
  filePath: string,
  content: string
): Promise<void> {
  const existing = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(filePath, existing + content);
}

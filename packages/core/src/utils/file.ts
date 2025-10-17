import fs from 'fs/promises';
import path from 'path';

export interface WriteFileOptions {
  append?: boolean;
}

export async function writeFile(
  fullPathOrDir: string,
  contentOrFilename: string,
  contentOrOptions?: string | WriteFileOptions,
  options?: WriteFileOptions
): Promise<void> {
  let fullPath: string;
  let content: string;
  let opts: WriteFileOptions = {};

  // Case 1: (dir, filename, content, options?)
  if (typeof contentOrOptions === 'string' && arguments.length >= 3) {
    fullPath = path.join(fullPathOrDir, contentOrFilename);
    content = contentOrOptions;
    opts = options || {};
  }
  // Case 2: (fullPath, content, options?)
  else if (
    typeof contentOrOptions === 'object' ||
    contentOrOptions === undefined
  ) {
    fullPath = fullPathOrDir;
    content = contentOrFilename;
    opts = (contentOrOptions as WriteFileOptions) || options || {};
  }
  // Case 3: (fullPath, content) - contentOrOptions is content (string)
  else if (typeof contentOrOptions === 'string' && arguments.length === 3) {
    fullPath = fullPathOrDir;
    content = contentOrOptions;
    opts = {};
  } else {
    throw new Error('Invalid arguments for writeFile');
  }

  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });

  if (opts.append && (await fs.stat(fullPath).catch(() => null))?.isFile()) {
    const existing = await fs.readFile(fullPath, 'utf8');
    content = existing + content;
  }

  await fs.writeFile(fullPath, content, 'utf8');
}

import fs from 'fs/promises';
import path from 'path';
export async function writeFile(
  fullPathOrDir,
  contentOrFilename,
  contentOrOptions,
  options
) {
  let fullPath;
  let content;
  let opts = {};
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
    opts = contentOrOptions || options || {};
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
//# sourceMappingURL=file.js.map

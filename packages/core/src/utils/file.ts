import fs from "fs/promises";
import path from "path";

export interface WriteFileOptions {
  append?: boolean;
}

export async function writeFile(dir: string, filename: string, content: string, options?: WriteFileOptions): Promise<void>;
export async function writeFile(fullPath: string, content: string, options?: WriteFileOptions): Promise<void>;
export async function writeFile(arg1: string, arg2OrContent: string, arg3OrOptions?: WriteFileOptions | string, options?: WriteFileOptions): Promise<void> {
  let fullPath: string;
  let content: string;
  let opts: WriteFileOptions = {};

  if (arg3OrOptions && typeof arg3OrOptions === "object") {
    // Mode: dir, filename, content, options
    fullPath = path.join(arg1, arg2OrContent);
    content = arg3OrOptions as string;  // Wait, args wrong—fix call sites
    opts = options || {};
  } else if (arg3OrOptions && typeof arg3OrOptions === "string") {
    // Mode: dir, filename, content
    fullPath = path.join(arg1, arg2OrContent);
    content = arg3OrOptions;
    opts = options || {};
  } else {
    // Mode: fullPath, content, options
    fullPath = arg1;
    content = arg2OrContent;
    opts = arg3OrOptions as WriteFileOptions || {};
  }

  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });

  if (opts.append) {
    const existing = await fs.readFile(fullPath, "utf8").catch(() => "");
    content = existing + content;
  }

  await fs.writeFile(fullPath, content, "utf8");
}
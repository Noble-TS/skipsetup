import { generateComprehensiveKiroContext } from './kiro-context-generator.js';
import { generateKiroContext } from './kiro-context-generator-ss.js';
import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { projectSizes } from '@skipsetup/core';
import fs from 'fs/promises';
import fsSync from 'fs';
import { performance } from 'perf_hooks';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');

// --- UI & TERMINAL UTILITIES ---

const STYLE = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',

  primary: '\x1b[38;2;99;102;241m',
  accent: '\x1b[38;2;6;182;212m',
  success: '\x1b[38;2;34;197;94m',
  warn: '\x1b[38;2;234;179;8m',
  error: '\x1b[38;2;239;68;68m',
  gray: '\x1b[38;2;107;114;128m',
  white: '\x1b[38;2;255;255;255m',
  bgPrimary: '\x1b[48;2;99;102;241m',
  bgSuccess: '\x1b[48;2;34;197;94m',
  bgWarn: '\x1b[48;2;234;179;8m',
  bgError: '\x1b[48;2;239;68;68m',
};

const ui = {
  badge: (text: string, color: keyof typeof STYLE, bg: keyof typeof STYLE) =>
    `${STYLE[bg]}${STYLE.white}${STYLE.bold} ${text} ${STYLE.reset}`,

  header: (title: string) => {
    console.log('\n' + STYLE.gray + '─'.repeat(60) + STYLE.reset);
    console.log(
      `  ${STYLE.bold}${STYLE.primary}${title.toUpperCase()}${STYLE.reset}`
    );
    console.log(STYLE.gray + '─'.repeat(60) + STYLE.reset + '\n');
  },

  step: (current: number, total: number, msg: string) => {
    console.log(
      `${STYLE.dim}[${current}/${total}]${STYLE.reset} ${STYLE.bold}${msg}${STYLE.reset}`
    );
  },

  substep: (msg: string) => {
    console.log(
      `${STYLE.gray}   │${STYLE.reset} ${STYLE.dim}${msg}${STYLE.reset}`
    );
  },

  success: (msg: string, elapsed?: string) => {
    const time = elapsed ? `${STYLE.dim} (${elapsed})${STYLE.reset}` : '';
    console.log(
      `${ui.badge('DONE', 'white', 'bgSuccess')} ${STYLE.success}${msg}${STYLE.reset}${time}\n`
    );
  },

  error: (msg: string) => {
    console.log(
      `${ui.badge('ERR', 'white', 'bgError')} ${STYLE.error}${msg}${STYLE.reset}\n`
    );
  },

  warn: (msg: string) => {
    console.log(
      `${ui.badge('WARN', 'white', 'bgWarn')} ${STYLE.warn}${msg}${STYLE.reset}`
    );
  },

  info: (label: string, value: string) => {
    console.log(
      `${STYLE.accent} › ${STYLE.bold}${label}:${STYLE.reset} ${value}`
    );
  },
};

async function measure<T>(fn: () => Promise<T> | T): Promise<[T, string]> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = ((end - start) / 1000).toFixed(2) + 's';
  return [result, duration];
}

function runQuietly(command: string, cwd: string) {
  try {
    execSync(command, { cwd, stdio: 'pipe' });
  } catch (error) {
    // Type assertion for Node.js errors with stdout/stderr
    const execError = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      message?: string;
    };

    if (execError.stdout) {
      console.log(
        typeof execError.stdout === 'string'
          ? execError.stdout
          : execError.stdout.toString()
      );
    }

    if (execError.stderr) {
      console.error(
        typeof execError.stderr === 'string'
          ? execError.stderr
          : execError.stderr.toString()
      );
    }

    throw error;
  }
}

// --- FILE OPERATIONS ---

async function writeFileLocal(
  fullPath: string,
  content: string,
  options?: { append?: boolean }
): Promise<void> {
  try {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    if (options?.append) {
      const existing = await fs.readFile(fullPath, 'utf8').catch(() => '');
      content = existing + content;
    }
    await fs.writeFile(fullPath, content, 'utf8');
  } catch {
    ui.error(`Failed to write ${fullPath}`);
  }
}

// --- MAIN LOGIC ---

export async function scaffoldProject(
  size: string,
  _template: string,
  projectDir: string
): Promise<void> {
  const config = projectSizes[size as keyof typeof projectSizes];
  const fullDir = path.resolve(projectDir);

  ui.header(`Scaffold Project: ${size}`);
  ui.info('Target', fullDir);
  ui.info(
    'Config',
    `${config.plugins.length} plugins, ${config.infra.length} services`
  );
  console.log(''); // Spacer

  if (fsSync.existsSync(fullDir)) {
    ui.substep('Cleaning existing directory...');
    await fs.rm(fullDir, { recursive: true, force: true });
  }

  try {
    // Step 1: Create T3 app
    ui.step(1, 7, 'Initialize System');
    ui.substep('Bootstrapping T3 App (Next.js, Tailwind, Prisma)...');

    await measure(() => {
      execSync(
        `pnpm create t3-app@latest ${projectDir} --CI --trpc --tailwind --prisma --eslint --noGit --noInstall --appRouter`,
        { cwd: process.cwd(), stdio: 'ignore', shell: '/bin/bash' } // muted stdio for clean UI
      );
    });
    // Manually logging success here to keep flow tight
    console.log(
      `${STYLE.gray}   │${STYLE.reset} ${STYLE.success}Core files generated${STYLE.reset}`
    );

    // Step 2: Patch Configuration
    ui.step(2, 7, 'Inject Dependencies');
    const pkgPath = path.join(fullDir, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

    pkg.dependencies = {
      ...pkg.dependencies,
      stripe: '^16.12.0',
      '@stripe/react-stripe-js': '^2.8.1',
      '@tanstack/react-query': '^5.90.5',
      '@trpc/client': '^11.6.0',
      '@trpc/next': '^11.6.0',
      '@trpc/react-query': '^11.6.0',
      '@react-email/components': '^1.0.1',
      'tailwind-merge': '^3.4.0',
      'better-auth': '^1.4.3',
      'lucide-react': '^0.555.0',
      '@trpc/server': '^11.6.0',
      superjson: '^2.2.2',
      resend: '^4.0.0',
      zod: '^3.25.76',
    };

    pkg.devDependencies = {
      ...pkg.devDependencies,
      prisma: '^6.17.1',
      '@types/node': '^20.19.21',
      '@types/react': '^19.2.2',
      '@types/react-dom': '^19.2.2',
      typescript: '^5.9.3',
      'typescript-eslint': '^8.46.1',
    };

    await writeFileLocal(pkgPath, JSON.stringify(pkg, null, 2));

    // TSConfig fixes
    const tsconfigPath = path.join(fullDir, 'tsconfig.json');
    if (fsSync.existsSync(tsconfigPath)) {
      let tsconfig = await fs.readFile(tsconfigPath, 'utf8');
      tsconfig = tsconfig
        .replace(/"verbatimModuleSyntax":\s*true,?\s*/g, '')
        .replace(
          /"moduleResolution":\s*"bundler"/g,
          '"moduleResolution": "node"'
        )
        .replace(/"resolveJsonModule":\s*false/g, '"resolveJsonModule": true');
      await writeFileLocal(tsconfigPath, tsconfig);
    }
    ui.substep('package.json and tsconfig.json patched');

    // Step 3: Install
    ui.step(3, 7, 'Install Dependencies');
    ui.substep('Running pnpm install (network-concurrency: 1)...');

    const [, installTime] = await measure(() => {
      try {
        execSync('pnpm install --prefer-offline --network-concurrency 1', {
          cwd: fullDir,
          stdio: 'inherit',
        });
      } catch {
        throw new Error('Dependency install failed');
      }
    });
    ui.success('Packages installed', installTime);

    // Step 4: tRPC setup
    ui.step(4, 7, 'Configure API Layer (tRPC)');

    await writeFileLocal(
      path.join(fullDir, 'src/server/api/trpc.ts'),
      `import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { type NextRequest } from 'next/server';

export const t = initTRPC.context<{ req: NextRequest; user?: { id: string; email: string } }>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) throw new Error('Unauthorized');
  return next({ ctx });
});

export const createTRPCRouter = t.router;
`
    );

    await writeFileLocal(
      path.join(fullDir, 'src/server/api/root.ts'),
      `import { createTRPCRouter } from '~/server/api/trpc';

export const appRouter = createTRPCRouter({});
export type AppRouter = typeof appRouter;
`
    );

    await writeFileLocal(
      path.join(fullDir, 'src/utils/api.ts'),
      `import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '~/server/api/root';

export const api = createTRPCReact<AppRouter>();
`
    );
    ui.substep('Router and Context initialized');

    // Step 5: Plugins
    ui.step(5, 7, 'Integrate Plugins');
    if (config.plugins.length > 0) {
      for (const plugin of config.plugins) {
        try {
          ui.substep(`Processing: ${plugin}`);
          await installPlugin(plugin, fullDir, rootDir);
        } catch {
          ui.warn(`Plugin ${plugin} skipped due to errors`);
        }
      }
    } else {
      ui.substep('No plugins requested');
    }

    ui.step(8, 8, 'Generating AI Development Context');

    try {
      // Determine which Kiro context generator to use based on project size
      if (size === 'small') {
        // Small project: Minimal MVP with Auth + DB basics - use comprehensive generator
        ui.substep(
          'Using comprehensive Kiro context generator for small project...'
        );

        // Capture plugin data for comprehensive context
        const pluginData = {
          files: await analyzeGeneratedFiles(projectDir),
          plugins: config.plugins, // ['small'] - this is just the plugin type
          modules: config.modules, // ['auth', 'db', 'email-resend']
          infra: config.infra, // ['local-db']
          description: config.description,
        };

        // Config for small projects (comprehensive generator)
        const smallConfig = {
          projectName: path.basename(projectDir),
          size: 'small',
          modules: config.modules,
          plugins: config.plugins,
          infra: config.infra,
          description: config.description,
        };

        await generateComprehensiveKiroContext(
          projectDir,
          smallConfig,
          pluginData
        );
        ui.success('Comprehensive Kiro AI context generated for MVP project');
      } else if (size === 'medium') {
        // Medium project: SaaS-ready with admin + monitoring + Stripe - use simpler generator
        ui.substep('Using basic Kiro context generator for medium project...');

        // Simple config for medium projects (basic generator)
        const mediumConfig = {
          projectName: path.basename(projectDir),
          size: 'medium',
          modules: config.modules, // ['auth', 'db', 'admin', 'stripe', 'email', 'monitoring-dashboard']
          plugins: config.plugins, // ['medium'] - this is just the plugin type
          infra: config.infra, // ['postgres', 'redis']
          description: config.description,
        };

        await generateKiroContext(projectDir, mediumConfig);
        ui.success('Basic Kiro AI context generated for SaaS-ready project');
      } else {
        // Fallback for 'large' or any other size - use comprehensive generator
        ui.substep('Using comprehensive Kiro context generator...');

        const pluginData = {
          files: await analyzeGeneratedFiles(projectDir),
          plugins: config.plugins,
          modules: config.modules,
          infra: config.infra,
          description: config.description,
        };

        await generateComprehensiveKiroContext(projectDir, config, pluginData);
        ui.success('Kiro AI context generated');
      }
    } catch (error) {
      ui.warn(
        `Kiro context generation had issues: ${error instanceof Error ? error.message : error}`
      );
    }

    // Step 6: Infrastructure
    ui.step(6, 7, 'Provision Local Infrastructure');
    await setupInfrastructure(config.infra, fullDir);
    await writeFileLocal(
      path.join(fullDir, 'skipsetup.yaml'),
      JSON.stringify(config, null, 2)
    );

    // Step 7: Finalize
    ui.step(7, 7, 'Quality Assurance');

    process.stdout.write(`${STYLE.gray}   │${STYLE.reset} Type checking... `);
    try {
      runQuietly('npx tsc --noEmit', fullDir);
      console.log(`${STYLE.success}OK${STYLE.reset}`);
    } catch {
      console.log(`${STYLE.warn}WARNINGS${STYLE.reset}`);
    }

    process.stdout.write(`${STYLE.gray}   │${STYLE.reset} Formatting... `);
    try {
      runQuietly('pnpm run format:write', fullDir);
      console.log(`${STYLE.success}OK${STYLE.reset}`);
    } catch {
      console.log(`${STYLE.dim}SKIPPED${STYLE.reset}`);
    }

    // Complete
    console.log('');
    ui.success('SCAFFOLD COMPLETE');

    console.log(`${STYLE.dim}   PROJECT LOCATION${STYLE.reset}`);
    console.log(`   ${STYLE.primary}${fullDir}${STYLE.reset}\n`);

    console.log(`${STYLE.dim}   NEXT STEPS${STYLE.reset}`);
    console.log(`   1. cd ${path.relative(process.cwd(), fullDir)}`);
    console.log(`   2. pnpm db:push`);
    console.log(`   3. pnpm dev`);
    console.log('');
  } catch {
    console.log('');
    ui.error('Scaffolding Failed');
    throw new Error('Scaffolding process encountered an error');
  }
}
async function analyzeGeneratedFiles(projectDir: string) {
  const files: Record<string, string> = {};

  // Analyze key files that were generated
  const keyFiles = [
    'src/env.js',
    'prisma/schema.prisma',
    'src/server/db.ts',
    'src/server/better-auth/config.ts',
    'src/server/api/trpc.ts',
    'src/trpc/react.tsx',
    'src/app/_components/auth/SignInForm.tsx',
  ];

  for (const file of keyFiles) {
    const fullPath = path.join(projectDir, file);
    if (fsSync.existsSync(fullPath)) {
      files[file] = await fs.readFile(fullPath, 'utf8');
    }
  }

  return files;
}
async function installPlugin(
  plugin: string,
  projectDir: string,
  rootDir: string
): Promise<void> {
  const pkgName = `@skipsetup/plugin-${plugin}`;
  const localPluginPath = path.join(rootDir, 'packages', `plugins-${plugin}`);
  const hasLocalPlugin = fsSync.existsSync(localPluginPath);

  if (hasLocalPlugin) {
    ui.substep(`Building local plugin: ${pkgName}`);
    try {
      runQuietly('pnpm build', localPluginPath);
      runQuietly(`pnpm add ${pkgName}@file:${localPluginPath}`, projectDir);
      ui.substep(`Installed local build of ${pkgName}`);
    } catch {
      ui.warn(`Local build failed for ${pkgName}. Falling back to npm...`);
      // Attempt to install from npm if local build fails
      installFromNpm(pkgName, projectDir);
    }
  } else {
    // Local path doesn't exist, install directly from npm
    ui.substep(`Local source not found, installing ${pkgName} from npm...`);
    installFromNpm(pkgName, projectDir);
  }
  activatePluginHook(pkgName, projectDir);
}

// Helper function to handle npm installation
function installFromNpm(pkgName: string, projectDir: string): void {
  try {
    runQuietly(`pnpm add ${pkgName}`, projectDir);
    ui.substep(`✓ Installed ${pkgName} from npm registry`);
  } catch {
    ui.error(`Failed to install ${pkgName} from npm registry.`);
  }
}

// Helper function to run the plugin's activation hook
function activatePluginHook(pkgName: string, projectDir: string): void {
  const manifestPath = path.join(
    projectDir,
    'node_modules',
    pkgName,
    'manifest.json'
  );
  if (!fsSync.existsSync(manifestPath)) return;

  try {
    const manifest = JSON.parse(fsSync.readFileSync(manifestPath, 'utf8'));
    const activateScript = manifest.hooks?.activate;
    if (!activateScript) return;

    const activatePath = path.join(
      projectDir,
      'node_modules',
      pkgName,
      activateScript
    );
    if (!fsSync.existsSync(activatePath)) return;

    runQuietly(`node "${activatePath}" "${projectDir}"`, projectDir);
    ui.substep(`Executed activation hook for ${pkgName}`);
  } catch {
    ui.warn(`Could not execute activation hook for ${pkgName}`);
  }
}

async function setupInfrastructure(
  infra: string[],
  projectDir: string
): Promise<void> {
  let content = `version: '3.8'\nservices:\n`;
  let hasService = false;

  if (infra.includes('postgres')) {
    content += `  postgres:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: password\n      POSTGRES_DB: app\n    ports:\n      - "5432:5432"\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n`;
    hasService = true;
  }
  if (infra.includes('redis')) {
    content += `  redis:\n    image: redis:7\n    ports:\n      - "6379:6379"\n`;
    hasService = true;
  }
  if (infra.includes('s3')) {
    content += `  minio:\n    image: minio/minio\n    command: server /data\n    ports:\n      - "9000:9000"\n    environment:\n      MINIO_ROOT_USER: minioadmin\n      MINIO_ROOT_PASSWORD: minioadmin\n`;
    hasService = true;
  }

  if (hasService) {
    content += `\nvolumes:\n  postgres_data:\n`;
    await writeFileLocal(path.join(projectDir, 'docker-compose.yml'), content);
    ui.substep('Generated docker-compose.yml');
  } else {
    ui.substep('No infrastructure services required');
  }
}

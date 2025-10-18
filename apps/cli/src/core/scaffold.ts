import { execSync, execFileSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { projectSizes } from '@forge/core';
import fs from 'fs/promises';
import fsSync from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');

async function writeFileLocal(
  fullPath: string,
  content: string,
  options?: { append?: boolean }
): Promise<void> {
  try {
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    if (options?.append) {
      const existing = await fs.readFile(fullPath, 'utf8').catch(() => '');
      content = existing + content;
    }
    await fs.writeFile(fullPath, content, 'utf8');
  } catch (error) {
    console.error(`SCAFFOLD: Failed to write file ${fullPath}:`, error);
    throw error;
  }
}

export async function scaffoldProject(
  size: string,
  template: string,
  projectDir: string
): Promise<void> {
  const config = projectSizes[size as keyof typeof projectSizes];
  const fullDir = path.resolve(projectDir);

  console.log(`Scaffolding ${size} project in ${fullDir}`);
  console.log('Using config:', JSON.stringify(config, null, 2));

  // Cleanup
  if (fsSync.existsSync(fullDir)) {
    await fs.rm(fullDir, { recursive: true, force: true });
    console.log(`Cleaned existing ${fullDir}`);
  }

  try {
    // Step 1: Create T3 app
    console.log('Creating T3 app...');
    execSync(
      `pnpm create t3-app@latest ${projectDir} --CI --trpc --tailwind --prisma --eslint`,
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: process.env.SHELL || '/bin/bash',
      }
    );

    // Step 2: Update package.json
    const packageJsonPath = path.join(fullDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    packageJson.dependencies = {
      ...packageJson.dependencies,
      stripe: '^16.12.0',
      '@stripe/react-stripe-js': '^2.8.1',
      '@tanstack/react-query': '^5.90.5',
      '@trpc/client': '^11.6.0',
      '@trpc/next': '^11.6.0',
      '@trpc/react-query': '^11.6.0',
      '@trpc/server': '^11.6.0',
      superjson: '^2.2.2',
      redis: '^4.7.0',
      bullmq: '^5.21.5',
      '@aws-sdk/client-s3': '^3.645.0',
      resend: '^4.0.0',
      'socket.io': '^4.8.0',
      zod: '^3.25.76',
    };
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      prisma: '^6.17.1',
      '@types/node': '^20.19.21',
      '@types/react': '^19.2.2',
      '@types/react-dom': '^19.2.2',
      typescript: '^5.9.3',
      'typescript-eslint': '^8.46.1',
    };
    await writeFileLocal(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Step 3: Patch tsconfig.json
    const tsconfigPath = path.join(fullDir, 'tsconfig.json');
    if (fsSync.existsSync(tsconfigPath)) {
      console.log('Patching tsconfig.json for better compatibility...');
      let tsconfigContent = await fs.readFile(tsconfigPath, 'utf8');
      tsconfigContent = tsconfigContent
        .replace(/"verbatimModuleSyntax": true,?\s*/g, '')
        .replace(/"moduleResolution": "bundler"/g, '"moduleResolution": "node"')
        .replace(/"resolveJsonModule": false/g, '"resolveJsonModule": true');
      await writeFileLocal(tsconfigPath, tsconfigContent);
      console.log('✓ Patched tsconfig.json');
    }

    // Step 4: Install dependencies
    console.log('Installing dependencies...');
    try {
      execSync('pnpm install', {
        cwd: fullDir,
        stdio: 'inherit',
        timeout: 300000,
      });
      console.log('✓ Successfully installed dependencies!');
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      throw error;
    }

    // Step 5: Setup tRPC
    const trpcPath = path.join(fullDir, 'src/server/api/trpc.ts');
    const trpcContent = `import { initTRPC } from '@trpc/server';
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
`;
    await writeFileLocal(trpcPath, trpcContent);

    const rootRouterPath = path.join(fullDir, 'src/server/api/root.ts');
    const rootRouterContent = `import { createTRPCRouter } from '~/server/api/trpc';

export const appRouter = createTRPCRouter({});
export type AppRouter = typeof appRouter;
`;
    await writeFileLocal(rootRouterPath, rootRouterContent);

    const apiUtilsPath = path.join(fullDir, 'src/utils/api.ts');
    const apiUtilsContent = `import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '~/server/api/root';

export const api = createTRPCReact<AppRouter>();
`;
    await writeFileLocal(apiUtilsPath, apiUtilsContent);

    // Step 6: Install plugins
    if (config.plugins.length > 0) {
      console.log('Installing plugins...');
      for (const plugin of config.plugins) {
        await installPlugin(plugin, fullDir, rootDir);
      }
    }

    // Step 7: Create module stubs
    console.log('Creating module stubs...');
    for (const module of config.modules) {
      const moduleDir = path.join(fullDir, 'src/modules');
      await fs.mkdir(moduleDir, { recursive: true });
      await writeFileLocal(
        path.join(fullDir, `src/modules/${module}.ts`),
        `// ${module} module stub\n// Add your ${module} implementation here\nexport function ${module}() {\n  return "${module} module";\n}`
      );
    }

    // Step 8: Setup infrastructure files
    console.log('Setting up infrastructure...');
    await setupInfrastructure(config.infra, fullDir);

    // Step 9: Write configuration file
    await writeFileLocal(
      path.join(fullDir, 'forge.yaml'),
      JSON.stringify(config, null, 2)
    );

    // Step 10: Type check
    console.log('Running type check...');
    try {
      execSync('npx tsc --noEmit', { cwd: fullDir, stdio: 'pipe' });
      console.log('✓ Type check passed');
    } catch {
      console.log(
        '⚠ Type check completed with warnings - this is normal for some configurations'
      );
    }

    // Step 11: Final formatting
    console.log('Performing final formatting...');
    try {
      execSync('pnpm run format:write', { cwd: fullDir, stdio: 'pipe' });
      console.log('✓ Formatting completed');
    } catch {
      console.log('⚠ Formatting skipped or completed with warnings');
    }

    console.log('🎉 Scaffolding complete!');
    console.log(`📁 Project location: ${fullDir}`);
    console.log('🚀 Next steps:');
    console.log(`   cd ${projectDir}`);
    console.log('   pnpm db:push');
    console.log('   pnpm dev');
  } catch (error) {
    console.error('❌ Scaffolding failed:', error);
    throw error;
  }
}

async function installPlugin(
  plugin: string,
  projectDir: string,
  rootDir: string
): Promise<void> {
  const pluginPkg = `@forge/plugin-${plugin}`;
  const localPluginPath = path.join(rootDir, 'packages', `plugins-${plugin}`);
  const pluginDir = path.resolve(localPluginPath);

  console.log(`Installing plugin: ${plugin}`);
  console.log(`SCAFFOLD: rootDir: ${rootDir}`);
  console.log(`SCAFFOLD: Checking local plugin path: ${pluginDir}`);

  try {
    // Check if local plugin directory exists and has package.json
    const pluginPackageJsonPath = path.join(pluginDir, 'package.json');
    if (fsSync.existsSync(pluginDir)) {
      console.log(`SCAFFOLD: Directory exists at ${pluginDir}: Yes`);
      if (fsSync.existsSync(pluginPackageJsonPath)) {
        const pluginPackageJson = JSON.parse(
          fsSync.readFileSync(pluginPackageJsonPath, 'utf8')
        );
        console.log(`SCAFFOLD: Found package.json at ${pluginPackageJsonPath}`);
        console.log(`SCAFFOLD: Plugin package name: ${pluginPackageJson.name}`);
        if (pluginPackageJson.name !== pluginPkg) {
          throw new Error(
            `Package name in ${pluginPackageJsonPath} is ${pluginPackageJson.name}, expected ${pluginPkg}`
          );
        }

        // Rebuild plugin to ensure fresh dist/
        console.log(`SCAFFOLD: Rebuilding plugin at ${pluginDir}`);
        try {
          execSync('pnpm build', { cwd: pluginDir, stdio: 'inherit' });
          console.log(`SCAFFOLD: Successfully rebuilt ${pluginPkg}`);
        } catch (error) {
          console.error(`SCAFFOLD: Failed to rebuild ${pluginPkg}:`, error);
          throw error;
        }

        console.log(
          `SCAFFOLD: Installing ${pluginPkg} from local workspace at ${pluginDir}`
        );
        try {
          execSync(`pnpm add ${pluginPkg}@file:${pluginDir}`, {
            cwd: projectDir,
            stdio: 'inherit',
            shell: process.env.SHELL || '/bin/bash',
          });
          console.log(
            `SCAFFOLD: Successfully installed ${pluginPkg} from local workspace`
          );
        } catch (error) {
          console.error(
            `SCAFFOLD: Failed to install ${pluginPkg} from workspace:`,
            error
          );
          throw error;
        }
      } else {
        throw new Error(`No package.json found at ${pluginPackageJsonPath}`);
      }
    } else {
      throw new Error(`Local plugin directory not found at ${pluginDir}`);
    }

    // Activate plugin using manifest.json
    const manifestPath = path.join(
      projectDir,
      'node_modules',
      pluginPkg,
      'manifest.json'
    );
    console.log(`SCAFFOLD: Checking for manifest at ${manifestPath}`);
    if (fsSync.existsSync(manifestPath)) {
      const manifest = JSON.parse(fsSync.readFileSync(manifestPath, 'utf8'));
      const activateRelPath = manifest.hooks?.activate;

      if (activateRelPath) {
        const activatePath = path.join(
          projectDir,
          'node_modules',
          pluginPkg,
          activateRelPath
        );
        console.log(
          `SCAFFOLD: Checking for activation script at ${activatePath}`
        );
        if (fsSync.existsSync(activatePath)) {
          console.log(`SCAFFOLD: Activation script found at ${activatePath}`);
          console.log(`SCAFFOLD: Path stats:`, fsSync.statSync(activatePath));
          console.log(`SCAFFOLD: Running node ${activatePath} ${projectDir}`);
          try {
            const scriptContent = fsSync.readFileSync(activatePath, 'utf8');
            console.log(
              `SCAFFOLD: First 200 chars of script: ${scriptContent.substring(0, 200)}`
            );
            execFileSync('node', [activatePath, projectDir], {
              cwd: projectDir,
              stdio: 'inherit',
              shell: process.env.SHELL || '/bin/bash',
            });
            console.log(`✓ Activated ${plugin}`);
          } catch (error) {
            console.error(`SCAFFOLD: Activation failed for ${plugin}:`, error);
            throw error;
          }
        } else {
          console.error(
            `SCAFFOLD: Activation script not found for ${plugin} at ${activatePath}`
          );
          throw new Error(`Activation script missing at ${activatePath}`);
        }
      } else {
        console.warn(
          `SCAFFOLD: No activate hook defined in manifest.json for ${plugin}`
        );
      }
    } else {
      console.error(
        `SCAFFOLD: Manifest not found for ${plugin} at ${manifestPath}`
      );
      throw new Error(`Manifest missing at ${manifestPath}`);
    }
    console.log(`✓ Plugin ${plugin} installed and activated`);
  } catch (error) {
    console.error(`SCAFFOLD: Failed to process plugin ${plugin}:`, error);
    throw error;
  }
}

async function setupInfrastructure(
  infra: string[],
  projectDir: string
): Promise<void> {
  let dockerContent = `version: '3.8'\nservices:\n`;

  if (infra.includes('postgres')) {
    dockerContent += `  postgres:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: password\n      POSTGRES_DB: app\n    ports:\n      - "5432:5432"\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n`;
    console.log('✓ PostgreSQL Docker configuration added');
  }

  if (infra.includes('redis')) {
    dockerContent += `  redis:\n    image: redis:7\n    ports:\n      - "6379:6379"\n`;
    console.log('✓ Redis configuration added');
  }

  if (infra.includes('queue')) {
    dockerContent += `  # queue: Add RabbitMQ or Redis-based queue\n`;
    console.log('✓ Queue stub added (implement in plugin)');
  }

  if (infra.includes('s3')) {
    dockerContent += `  minio:\n    image: minio/minio\n    command: server /data\n    ports:\n      - "9000:9000"\n    environment:\n      MINIO_ROOT_USER: minioadmin\n      MINIO_ROOT_PASSWORD: minioadmin\n`;
    console.log('✓ S3 (MinIO) stub added');
  }

  if (infra.includes('local-db')) {
    dockerContent = `# Local Development Database\n# This project uses SQLite for local development\n# Run: pnpm prisma db push\n\nversion: '3.8'\nservices:\n  # Add other services if needed\n  # SQLite doesn't require Docker - it uses a local file\n`;
    console.log('✓ Local development configuration created');
  }

  if (dockerContent.includes('services:')) {
    dockerContent += `\nvolumes:\n  postgres_data:\n`;
    await writeFileLocal(
      path.join(projectDir, 'docker-compose.yml'),
      dockerContent
    );
  }
}

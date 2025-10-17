import { describe, it, expect, vi } from 'vitest';
import { scaffoldProject } from '../src/core/scaffold';
import { execSync } from 'child_process'; // For expect ref
import { writeFile } from '@forge/core'; // If asserted

// Hoisted mocks (Vitest auto-hoists)
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('@forge/core', async () => {
  const actual = await vi.importActual('@forge/core');
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

describe('scaffoldProject', () => {
  it('scaffolds small project', async () => {
    await scaffoldProject('small', 't3', '/tmp/test');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('create-t3-app'),
      expect.any(Object)
    );
    expect(writeFile).toHaveBeenCalled(); // Add asserts for modules/infra
    // expect(execSync).toHaveBeenCalledWith("pnpm install", ...);
  });
});

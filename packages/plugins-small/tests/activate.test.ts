import { describe, it, expect, vi } from 'vitest';
import { activate } from '../src/hooks/activate';
import { execSync } from 'child_process';
import { writeFile } from '@skipsetup/core/utils/file';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('@skipsetup/core/utils/file', () => ({
  writeFile: vi.fn(),
}));

describe('activate', () => {
  it('activates stripe plugin', async () => {
    await activate('/tmp/test');
    expect(execSync).toHaveBeenCalledWith(
      'pnpm add stripe',
      expect.any(Object)
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('src/utils/stripe.ts'),
      expect.any(String)
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.env.example'),
      expect.any(String),
      expect.any(Object)
    );
  });
});

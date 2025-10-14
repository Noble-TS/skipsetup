import { describe, it, expect } from 'vitest';
import { ProjectSizeSchema, projectSizes } from '../src/configs/sizes';

describe('sizes', () => {
  it('validates small size', () => {
    const result = ProjectSizeSchema.safeParse('small');
    expect(result.success).toBe(true);
    expect(projectSizes.small.modules).toEqual(['auth', 'db']);
  });
});

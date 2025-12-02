import { z } from 'zod';

export const ProjectSizeSchema = z.enum(['small', 'medium', 'large']);
export type ProjectSize = z.infer<typeof ProjectSizeSchema>;

export const projectSizes: Record<
  ProjectSize,
  {
    description: string;
    modules: string[];
    plugins: string[];
    infra: string[];
  }
> = {
  small: {
    description: 'Minimal MVP: Auth + DB basics.',
    modules: ['auth', 'db', 'email-resend'],
    plugins: ['small'],
    infra: ['local-db'],
  },
  medium: {
    description: 'SaaS-ready: Admin + monitoring.',
    modules: ['auth', 'db', 'admin', 'stripe', 'email', 'monitoring-dashboard'],
    plugins: ['medium'],
    infra: ['postgres', 'redis'],
  },
  large: {
    description: 'Enterprise: Orgs + scales hhjhj.',
    modules: ['auth', 'db', 'admin', 'orgs', 'payments', 'monitoring'],
    plugins: [
      // 'email-password',
      // 'social-login',
      // 'admin-panel',
      // 'org-management',
      'medium',
    ],
    infra: ['postgres', 'redis', 'queue', 's3'],
  },
};

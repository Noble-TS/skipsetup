// apps/cli/src/configs/sizes.ts
export const projectSizes = {
  small: {
    description: 'Minimal MVP: Auth + DB basics.',
    modules: ['auth', 'db'],
    plugins: ['better-auth-basic', 'prisma-basic'],
    infra: ['local-db'],
    featureLevels: {
      auth: 'basic',
      payments: 'none',
      communications: 'basic',
      realtime: 'none',
    },
  },
  medium: {
    description: 'SaaS-ready: Admin + monitoring.',
    modules: ['auth', 'db', 'admin', 'monitoring'],
    plugins: [
      'better-auth-social',
      'prisma-postgres',
      'admin-panel',
      'monitoring-basic',
      'stripe-subscriptions',
    ],
    infra: ['postgres', 'redis'],
    featureLevels: {
      auth: 'social',
      payments: 'subscriptions',
      communications: 'transactional',
      realtime: 'basic',
    },
  },
  large: {
    description: 'Enterprise: Orgs + scale.',
    modules: ['auth', 'db', 'admin', 'orgs', 'payments', 'monitoring'],
    plugins: [
      // 'better-auth-enterprise',
      // 'prisma-distributed',
      // 'admin-panel',
      // 'monitoring-advanced',
      'stripe', // Maps to @forge/plugin-stripe with platform features
      // 'resend-marketing',
      // 'socket-enterprise',
      // 'queue',
      // 's3',
    ],
    infra: ['postgres', 'redis', 'queue', 's3'],
    featureLevels: {
      auth: 'enterprise',
      payments: 'platform',
      communications: 'marketing',
      realtime: 'enterprise',
    },
  },
};

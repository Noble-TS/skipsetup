# fullstackforge
Build full-stack apps that are the right size, right now. Stop over-engineering weekend projects or under-building SaaS apps. Choose your size—small, medium, or large—and get a tailored stack with auth, payments, and deployment ready in minutes. Start coding what matters, not the setup.



fullstackforge/
├── apps/                  # Standalone apps (e.g., CLI entry)
│   └── cli/               # NPM-published CLI package
│       ├── src/           # Source code
│       │   ├── cli.ts     # Main entry (Clipanion setup)
│       │   ├── commands/  # CLI commands (init, add, deploy)
│       │   │   ├── init.ts
│       │   │   ├── add.ts
│       │   │   └── deploy.ts
│       │   ├── core/      # Shared orchestration (scaffold, manifest)
│       │   │   ├── scaffold.ts
│       │   │   ├── manifest.ts
│       │   │   └── secrets.ts
│       │   └── plugins/   # Plugin loader/resolver
│       │       └── loader.ts
│       ├── package.json   # { "name": "fullstackforge", "bin": { "forge": "dist/cli.js" } }
│       ├── tsconfig.json  # Strict TS config
│       └── tests/         # Vitest suites
│           └── scaffold.test.ts
├── packages/              # Shared libs
│   ├── core/              # Reusable logic (configs, utils)
│       ├── src/
│       │   ├── configs/   # Size presets
│       │   │   └── sizes.ts
│       │   ├── utils/     # Helpers (file ops, type checks)
│       │   │   └── file.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│   └── plugins-example/   # Template for community plugins (e.g., @forge/plugin-stripe)
│       ├── src/
│       │   ├── manifest.json
│       │   └── hooks/
│       │       └── afterInstall.ts
│       └── package.json   # { "name": "@forge/plugin-stripe" }
├── examples/              # Demo projects (small/medium/large)
│   ├── small-saas/        # Minimal scaffold output
│   ├── medium-dashboard/  # With admin/plugins
│   └── large-enterprise/  # Full infra
│       └── forge.yaml     # Generated manifest
├── docs/                  # Documentation
│   ├── README.md          # Project overview, install, usage
│   ├── CONTRIBUTING.md    # Plugin dev guide
│   └── api.md             # CLI reference
├── .github/               # CI/CD
│   └── workflows/
│       ├── ci.yml         # Lint/test/build
│       └── release.yml    # Semantic-release on main
├── turbo.json             # Turborepo config (parallel builds)
├── package.json           # Root (workspaces: ["apps/*", "packages/*"])
├── tsconfig.json          # Base TS (strict: true, paths: {"@/*": ["./*"]})
├── .eslintrc.js           # ESLint + @typescript-eslint
├── .prettierrc            # Prettier rules
├── .gitignore             # Node defaults + .forge/
└── LICENSE                # MIT
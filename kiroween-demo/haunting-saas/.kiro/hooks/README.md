# Kiro Hooks System

## Available Hooks
Hooks are automated scripts that run at specific points in the development lifecycle.

### Pre-commit Hook
- **Purpose**: Ensure code quality before commits
- **Runs**: Type checking, linting, tests
- **Location**: `hooks/pre-commit.sh`

### Post-generation Hook
- **Purpose**: Set up project after generation
- **Runs**: Prisma client generation, database setup, initial build
- **Location**: `hooks/post-generation.sh`

## Using Hooks

### Manual Execution
```bash
# Run specific hook
./.kiro/hooks/pre-commit.sh
# Run all enabled hooks for a trigger (conceptual)
# find .kiro/hooks -name "*.sh" -exec {} \;
```

### Automatic Execution
Hooks are designed to be triggered automatically by development tools or processes:
- Git hooks (e.g., pre-commit) can be configured separately using tools like Husky.
- Project generation scripts can call post-generation hooks.

## Custom Hooks
Create new hooks by adding files to the `hooks/` directory following the JSON and .sh naming convention:
```json
{
  "name": "custom-hook",
  "description": "Custom hook description",
  "script": "#!/bin/bash\necho 'Custom hook executed'",
  "triggers": ["commit", "deploy"], // Define when it should run
  "enabled": true
}
```

## Configuration
Enable/disable hooks in their JSON configuration files by setting `"enabled": false`.

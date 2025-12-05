# Kiro Hooks System

##  Available Hooks

Hooks are automated scripts that run at specific points in the development lifecycle.

### Pre-commit Hook
- **Purpose**: Ensure code quality before commits
- **Runs**: Type checking, linting, tests
- **Location**: `hooks/pre-commit.sh`

### Post-generation Hook  
- **Purpose**: Set up project after generation
- **Runs**: Database setup, initial builds
- **Location**: `hooks/post-generation.sh`

### Pre-deploy Hook
- **Purpose**: Verify production readiness
- **Runs**: Build verification, tests, security audit
- **Location**: `hooks/pre-deploy.sh`

### Schema Validation Hook
- **Purpose**: Validate database schema changes
- **Runs**: Schema generation, database tests
- **Location**: `hooks/schema-validation.sh`

##  Using Hooks

### Manual Execution
```bash
# Run specific hook
./.kiro/hooks/pre-commit.sh

# Run all hooks for a trigger
find .kiro/hooks -name "*.sh" -exec {} \;
```

### Automatic Execution
Hooks are automatically triggered by:
- Git commits (pre-commit)
- Project generation (post-generation) 
- Deployment processes (pre-deploy)
- Schema changes (schema-validation)

##  Custom Hooks

Create new hooks by adding files to the `hooks/` directory:

```json
{
  "name": "custom-hook",
  "description": "Custom hook description",
  "script": "#!/bin/bash\necho 'Custom hook'",
  "triggers": ["commit", "deploy"],
  "enabled": true
}
```

##  Configuration

Enable/disable hooks in their JSON configuration files by setting `"enabled": false`

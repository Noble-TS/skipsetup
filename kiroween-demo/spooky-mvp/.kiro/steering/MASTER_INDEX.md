# SkipSetup Kiro Context Index

##  AVAILABLE DOCUMENTATION

### Core Documentation
1. **Project Blueprint** (`project-blueprint.md`) - Complete project overview and constraints
2. **Architecture Documentation** (`architecture-documentation.md`) - System architecture and data flows  
3. **Development Workflows** (`development-workflows.md`) - Step-by-step development processes
4. **Plugin Intelligence** (`plugin-intelligence.md`) - Plugin-specific capabilities and patterns

### Custom Agents
- **fullstack-specialist** - Complete fullstack development with all constraints
- **auth-expert** - Authentication and user management specialist  
- **database-architect** - Database schema and Prisma operations

### System Specifications
- **API Specifications** (`api-specifications.md`) - Complete API endpoint documentation
- **Component Specifications** (`component-specifications.md`) - UI component specifications
- **Database Specifications** (`database-specifications.md`) - Database schema and operations

### Hooks & Automation
- **Pre-commit Hooks** - Code quality and validation
- **Post-generation Hooks** - Project setup automation
- **Validation Hooks** - Data and schema validation

### MCP Integration
- **MCP Configuration** - Model Context Protocol setup
- **Tool Definitions** - Available MCP tools and capabilities

## QUICK START FOR KIRO

### When Developing New Features:
1. Start with `development-workflows.md` for step-by-step guidance
2. Check `project-blueprint.md` for project-specific constraints
3. Consult `architecture-documentation.md` for system understanding
4. Use appropriate custom agent for specialized tasks

### Key Constraints to Remember:
- Never modify core authentication files
- Always use existing component patterns
- Follow tRPC procedure patterns for new APIs
- Use Prisma client (never raw SQL) for database operations

## AGENT RECOMMENDATIONS

| Task Type | Recommended Agent | Key Resources |
|-----------|-------------------|---------------|
| General Development | `fullstack-specialist` | All documentation |
| Authentication | `auth-expert` | Plugin intelligence + Architecture |
| Database Changes | `database-architect` | Architecture + Development workflows |
| UI Components | `fullstack-specialist` | Development workflows + Project blueprint |

This context provides 100% understanding of the SkipSetup-generated project for zero-error development.

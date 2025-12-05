# Model Context Protocol (MCP) Configuration

##  MCP Servers

MCP servers provide tools and resources to AI assistants through a standardized protocol.

### Available Servers

#### File System Server
- **Command**: `npx @modelcontextprotocol/server-filesystem`
- **Purpose**: File read/write operations within project
- **Allowed Paths**: Project directory only

#### PostgreSQL Server  
- **Command**: `npx @modelcontextprotocol/server-postgres`
- **Purpose**: Database query execution and management
- **Environment**: DATABASE_URL required

#### GitHub Server
- **Command**: `npx @modelcontextprotocol/server-github` 
- **Purpose**: GitHub repository search and operations
- **Environment**: GITHUB_TOKEN required

##  Available Tools

### File Operations
- `read-file` - Read file contents
- `write-file` - Write to files
- `list-directory` - Browse directory structure

### Database Operations
- `query-database` - Execute SQL queries on PostgreSQL

### GitHub Operations  
- `github-search` - Search GitHub repositories and code

##  Setup Instructions

### Environment Configuration
```bash
# Database connection
export DATABASE_URL="postgresql://user:pass@localhost:5432/app"

# GitHub access (optional)
export GITHUB_TOKEN="your_github_token"
```

### Manual Server Testing
```bash
# Test file system server
npx @modelcontextprotocol/server-filesystem spooky-mvp

# Test PostgreSQL server  
npx @modelcontextprotocol/server-postgres
```

##  Integration with Kiro

MCP tools are automatically available to Kiro agents through the `tools` field in agent configurations.

### Agent Tool Access
```json
{
  "tools": ["read", "write", "execute", "mcp-file-system", "mcp-postgres"]
}
```

##  Security Notes

- File system access is restricted to project directory
- Database operations use connection pooling
- GitHub access requires explicit token configuration
- All operations are logged for audit purposes

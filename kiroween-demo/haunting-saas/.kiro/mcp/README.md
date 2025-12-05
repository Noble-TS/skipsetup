# Model Context Protocol (MCP) Integration

## Configuration
MCP servers are configured in `mcp/config.json`. The configuration specifies available servers and their environment variables. The file is generated based on the project directory and environment.

### Available Servers
- **file-system**: Provides access to the project's file system (`haunting-saas`).
- **postgres**: Provides access to the PostgreSQL database.
- **github**: Provides access to GitHub API (requires token).

### Running MCP Servers
```bash
# Test file system server (replace [PROJECT_DIR] with actual path)
npx @modelcontextprotocol/server-filesystem haunting-saas

# Test PostgreSQL server (requires DATABASE_URL)
npx @modelcontextprotocol/server-postgres
```

## Integration with Kiro
MCP tools are available to Kiro agents if configured in their agent definition's `tools` field.

### Agent Tool Access (Example)
```json
{
  "tools": [
    "read-file",
    "write-file",
    "list-directory",
    "query-database"
  ]
}
```

## Security Notes
- File system access is restricted to the project directory (`haunting-saas`).
- Database operations use connection pooling via the specified DATABASE_URL.
- GitHub access requires an explicit GITHUB_TOKEN environment variable.
- All operations should be logged for audit purposes (implementation dependent).

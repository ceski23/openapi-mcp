# OpenApi MCP

MCP server for loading and exploring OpenAPI/Swagger specifications. Lets AI assistants browse API contracts dynamically — load any OpenAPI spec, search endpoints, inspect schemas, and retrieve operations — without needing the spec in-context.

## Usage

### Manually

Add to your MCP client config:

```json
{
  "mcpServers": {
    "openapi-mcp": {
      "command": "npx",
      "args": ["-y", "@ceski23/openapi-mcp"]
    }
  }
}
```

### Via AI agent

Ask your AI assistant to add it:

> Add the MCP server `@ceski23/openapi-mcp` to my config. Run it with `npx -y @ceski23/openapi-mcp` via stdio.

Most assistants can modify your MCP config file directly.

## Tools

| Tool | Description |
|---|---|
| `load_spec` | Load an OpenAPI/Swagger spec from a URL or file path. Returns a `specId` used by other tools. |
| `find_operations` | Search operations by operationId, path, summary, tags, or description. |
| `get_operation` | Get full details for a specific operation by operationId. |
| `get_path` | Get all HTTP methods defined on a specific path. |
| `find_schemas` | Search schema/definition names. |
| `get_schema` | Get a fully dereferenced schema by name. |
| `search_contract` | Search both operations and schemas in one call. |

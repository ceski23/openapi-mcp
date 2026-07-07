# OpenAPI MCP

MCP server for loading and exploring OpenAPI/Swagger specifications. Lets AI assistants browse API contracts dynamically — load any OpenAPI spec, search endpoints, inspect schemas, retrieve operations, diff versions — all through MCP tools.

## Usage

### Prerequisites

- **Node.js >= 22** or **Bun >= 1.0**
- **oasdiff** (optional) — required only for the `diff_specs` tool. Install from [github.com/oasdiff/oasdiff](https://github.com/oasdiff/oasdiff).

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
| `load_spec` | Load an OpenAPI/Swagger spec from a URL or local file path. Parses and validates the spec, returns a `specId` for use by other tools. |
| `find_operations` | Search operations in a loaded spec by operationId, path, summary, tags, or description. Supports filtering by HTTP method and tags, with pagination. |
| `get_operation` | Get full details for a single operation by operationId — method, path, parameters, requestBody, and responses. |
| `get_path` | Get all HTTP methods defined on a specific path. Returns a summary of each method. |
| `find_schemas` | Search component/definition schema names in a loaded spec. Supports pagination. |
| `get_schema` | Retrieve a fully dereferenced component/definition schema by name. |
| `search_contract` | Search both operations and schemas in a single call — matches against operationIds, summaries, tags, paths, schema names, schema descriptions, property names, and enum values. The best first call when exploring an API. |
| `diff_specs` | Compare two loaded OpenAPI specs. Supports summary, detailed (JSON), and markdown changelog output. **Requires `oasdiff` on PATH.** |
| `list_cached_specs` | List all currently cached specs with their specIds, sources, titles, and versions. |
| `list_versions` | List all cached versions for a specId (tracked across repeated loads of the same source). |
| `unload_spec` | Remove a loaded spec (and its version history) from the cache by specId. |
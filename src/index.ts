#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadSpec } from './tools/load-spec'
import { findOperations } from './tools/find-operations'
import { getOperation } from './tools/get-operation'
import { getPath } from './tools/get-path'
import { findSchemas } from './tools/find-schemas'
import { getSchema } from './tools/get-schema'
import { searchContract } from './tools/search-contract'
import { listCachedSpecs } from './tools/list-cached-specs'

const server = new McpServer({
    name: 'openapi-mcp',
    version: '0.1.0',
})

for (const { name, description, inputSchema, execute } of [
    loadSpec,
    findOperations,
    getOperation,
    getPath,
    findSchemas,
    getSchema,
    searchContract,
    listCachedSpecs,
]) {
    server.registerTool(name, { description, inputSchema }, execute)
}

const transport = new StdioServerTransport()
await server.connect(transport)

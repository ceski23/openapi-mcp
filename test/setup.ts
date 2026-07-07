import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { loadSpec as loadSpecTool } from '../src/tools/load-spec'
import { findOperations } from '../src/tools/find-operations'
import { getOperation } from '../src/tools/get-operation'
import { getPath } from '../src/tools/get-path'
import { findSchemas } from '../src/tools/find-schemas'
import { getSchema } from '../src/tools/get-schema'
import { searchContract } from '../src/tools/search-contract'
import { listVersions } from '../src/tools/list-versions'
import { listCachedSpecs } from '../src/tools/list-cached-specs'
import { unloadSpec } from '../src/tools/unload-spec'

export type TestContext = {
    server: McpServer
    client: Client
}

export async function createTestContext(): Promise<TestContext> {
    const server = new McpServer({ name: 'test-server', version: '1.0.0' })
    const client = new Client({ name: 'test-client', version: '1.0.0' })

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    const tools = [
        loadSpecTool,
        findOperations,
        getOperation,
        getPath,
        findSchemas,
        getSchema,
        searchContract,
        listVersions,
        listCachedSpecs,
        unloadSpec,
    ]
    for (const { name, description, inputSchema, execute } of tools) {
        server.registerTool(name, { description, inputSchema }, execute)
    }

    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)])

    return { server, client }
}

export async function loadSpec(client: Client): Promise<string> {
    const result = await client.callTool({
        name: 'load_spec',
        arguments: { source: 'test/fixtures/petstore.json' },
    })
    const text = (result.content as { text: string }[])[0]!.text
    const parsed = JSON.parse(text)
    if (!parsed.success) {
        throw new Error(`Failed to load spec: ${text}`)
    }

    return parsed.specId as string
}

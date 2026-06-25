import { test, expect, describe, beforeEach } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { loadSpec as loadSpecTool } from '../src/tools/load-spec'

let client: Client

beforeEach(async () => {
    const server = new McpServer({ name: 'test-server', version: '1.0.0' })
    client = new Client({ name: 'test-client', version: '1.0.0' })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    server.registerTool(
        loadSpecTool.name,
        { description: loadSpecTool.description, inputSchema: loadSpecTool.inputSchema },
        loadSpecTool.execute,
    )
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)])
})

describe('load_spec', () => {
    test('loads petstore spec successfully', async () => {
        const result = await client.callTool({
            name: 'load_spec',
            arguments: { source: 'test/fixtures/petstore.json' },
        })
        const text = (result.content as { text: string }[])[0]!.text
        const data = JSON.parse(text)
        expect(data.success).toBe(true)
        expect(data.specId).toBeDefined()
        expect(typeof data.specId).toBe('string')
        expect(data.title).toBe('Swagger Petstore - OpenAPI 3.0')
        expect(data.version).toBe('1.0.27')
        expect(data.endpoints).toBeGreaterThan(0)
        expect(data.schemas).toBeGreaterThan(0)
        expect(data.source).toBe('test/fixtures/petstore.json')
    })

    test('returns error for non-existent file', async () => {
        const result = await client.callTool({
            name: 'load_spec',
            arguments: { source: 'examples/nonexistent.json' },
        })
        expect(result.isError).toBe(true)
    })

    test('returns error for file that is not an OpenAPI spec', async () => {
        const result = await client.callTool({
            name: 'load_spec',
            arguments: { source: 'test/fixtures/not-an-openapi-spec.json' },
        })
        expect(result.isError).toBe(true)
    })
})

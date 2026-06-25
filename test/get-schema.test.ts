import { test, expect, describe, beforeEach } from 'bun:test'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createTestContext, loadSpec } from './setup'

let client: Client
let specId: string

beforeEach(async () => {
    const ctx = await createTestContext()
    specId = await loadSpec(ctx.client)
    client = ctx.client
})

describe('get_schema', () => {
    test('retrieves a schema by name', async () => {
        const result = await client.callTool({
            name: 'get_schema',
            arguments: { specId, name: 'Pet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.type).toBe('object')
        expect(data.properties).toBeDefined()
        expect(data.properties.name).toBeDefined()
        expect(data.properties.name.example).toBe('doggie')
        expect(data.required).toContain('name')
        expect(data.required).toContain('photoUrls')
    })

    test('returns error for non-existent schema', async () => {
        const result = await client.callTool({
            name: 'get_schema',
            arguments: { specId, name: 'NonExistent' },
        })
        expect(result.isError).toBe(true)
        const text = (result.content as { text: string }[])[0]!.text
        expect(text).toContain('No schema found with name "NonExistent"')
    })

    test('retrieves User schema', async () => {
        const result = await client.callTool({
            name: 'get_schema',
            arguments: { specId, name: 'User' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.type).toBe('object')
        expect(data.properties.username).toBeDefined()
        expect(data.properties.username.example).toBe('theUser')
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'get_schema',
            arguments: { specId: crypto.randomUUID(), name: 'Pet' },
        })
        expect(result.isError).toBe(true)
    })
})

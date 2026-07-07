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

describe('find_schemas', () => {
    test('finds schemas by partial name match', async () => {
        const result = await client.callTool({
            name: 'find_schemas',
            arguments: { specId, query: 'Pet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'Pet' }))
    })

    test('finds schemas by lowercase query', async () => {
        const result = await client.callTool({
            name: 'find_schemas',
            arguments: { specId, query: 'user' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'User' }))
    })

    test('returns empty array for no match', async () => {
        const result = await client.callTool({
            name: 'find_schemas',
            arguments: { specId, query: 'xyznonexistent' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.results).toEqual([])
        expect(data.total).toBe(0)
    })

    test('returns all schemas with empty query', async () => {
        const result = await client.callTool({
            name: 'find_schemas',
            arguments: { specId, query: '' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBe(6)
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'Pet' }))
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'User' }))
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'Order' }))
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'Category' }))
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'Tag' }))
        expect(data.results).toContainEqual(expect.objectContaining({ name: 'ApiResponse' }))
    })

    test('returns schemas with type and description', async () => {
        const result = await client.callTool({
            name: 'find_schemas',
            arguments: { specId, query: 'Order' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.results).toContainEqual(
            expect.objectContaining({ name: 'Order', type: 'object' }),
        )
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'find_schemas',
            arguments: { specId: crypto.randomUUID(), query: 'Pet' },
        })
        expect(result.isError).toBe(true)
    })
})

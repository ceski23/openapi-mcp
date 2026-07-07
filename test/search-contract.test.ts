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

describe('search_contract', () => {
    test('searches operations by operationId', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'getPetById' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.operations).toBeDefined()
        expect(data.operations.length).toBeGreaterThanOrEqual(1)
        expect(
            data.operations.some((op: { operationId: string }) => op.operationId === 'getPetById'),
        ).toBe(true)
    })

    test('searches schemas by name', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'Category' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.schemas).toBeDefined()
        expect(data.schemas).toContain('Category')
    })

    test('returns both operations and schemas for a broad query', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'pet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.operations).toBeDefined()
        expect(data.operations.length).toBeGreaterThan(0)
        expect(data.schemas).toBeDefined()
        expect(data.schemas.length).toBeGreaterThan(0)
    })

    test('returns empty result for no match', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'xyznonexistent' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.totalOperations).toBe(0)
        expect(data.totalSchemas).toBe(0)
        expect(data.operations).toBeUndefined()
        expect(data.schemas).toBeUndefined()
    })

    test('returns only operations when query only matches operations', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'findPetsByStatus' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.operations).toBeDefined()
        expect(data.schemas).toBeUndefined()
    })

    test('searches schemas by property name', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'photoUrls' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.schemas).toBeDefined()
        expect(data.schemas).toContain('Pet')
    })

    test('searches schemas by property description', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'Order Status' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.schemas).toBeDefined()
        expect(data.schemas).toContain('Order')
    })

    test('searches schemas by enum value', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'delivered' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.schemas).toBeDefined()
        expect(data.schemas).toContain('Order')
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId: crypto.randomUUID(), query: 'pet' },
        })
        expect(result.isError).toBe(true)
    })

    test('fuzzy matches operations with typos', async () => {
        const result = await client.callTool({
            name: 'search_contract',
            arguments: { specId, query: 'getPet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.operations).toBeDefined()
        expect(
            data.operations.some((op: { operationId: string }) => op.operationId === 'getPetById'),
        ).toBe(true)
    })
})

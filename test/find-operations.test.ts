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

describe('find_operations', () => {
    test('finds operations by operationId', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'getPetById' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBe(1)
        expect(data.page).toBe(1)
        expect(data.results).toHaveLength(1)
        expect(data.results[0].operationId).toBe('getPetById')
        expect(data.results[0].method).toBe('GET')
        expect(data.results[0].path).toBe('/pet/{petId}')
    })

    test('finds operations by path', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: '/pet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
        expect(data.results.some((op: { path: string }) => op.path.includes('/pet'))).toBe(true)
    })

    test('finds operations by tag', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'store' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
    })

    test('returns empty array for no match', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'xyznonexistent123' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.results).toEqual([])
        expect(data.total).toBe(0)
    })

    test('returns all operations when query is omitted', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
        expect(data.results.every((op: { operationId: string }) => op.operationId)).toBe(true)
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId: crypto.randomUUID(), query: 'pet' },
        })
        expect(result.isError).toBe(true)
    })

    test('filters by tag', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, tags: ['store'] },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
        expect(data.results.every((op: { tags?: string[] }) => op.tags?.includes('store'))).toBe(
            true,
        )
    })

    test('filters by multiple tags (any match)', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, tags: ['store', 'user'] },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
        expect(
            data.results.every((op: { tags?: string[] }) =>
                op.tags?.some((tag) => ['store', 'user'].includes(tag)),
            ),
        ).toBe(true)
    })

    test('returns empty when no operations match tags', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, tags: ['nonexistent-tag-xyz'] },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.results).toEqual([])
        expect(data.total).toBe(0)
    })

    test('filters by method', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, methods: ['DELETE'] },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
        expect(data.results.every((op: { method: string }) => op.method === 'DELETE')).toBe(true)
    })

    test('combines query, tags, and methods', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'pet', tags: ['pet'], methods: ['GET'] },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
        expect(
            data.results.every(
                (op: { method: string; tags?: string[] }) =>
                    op.method === 'GET' && op.tags?.includes('pet'),
            ),
        ).toBe(true)
    })

    test('filters by tag case-insensitively', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, tags: ['STORE'] },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.total).toBeGreaterThan(0)
        expect(data.results.every((op: { tags?: string[] }) => op.tags?.includes('store'))).toBe(
            true,
        )
    })

    test('includes tags in result', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'addPet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.results[0].tags).toContain('pet')
    })
})

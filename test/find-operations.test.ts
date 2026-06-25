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
        expect(data).toHaveLength(1)
        expect(data[0].operationId).toBe('getPetById')
        expect(data[0].method).toBe('GET')
        expect(data[0].path).toBe('/pet/{petId}')
    })

    test('finds operations by path', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: '/pet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.length).toBeGreaterThan(0)
        expect(data.some((op: { path: string }) => op.path.includes('/pet'))).toBe(true)
    })

    test('finds operations by tag', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'store' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.length).toBeGreaterThan(0)
    })

    test('returns empty array for no match', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'xyznonexistent123' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data).toEqual([])
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId: crypto.randomUUID(), query: 'pet' },
        })
        expect(result.isError).toBe(true)
    })
})

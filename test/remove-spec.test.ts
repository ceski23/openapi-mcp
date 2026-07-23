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

describe('remove_spec', () => {
    test('removes a spec from cache', async () => {
        const result = await client.callTool({
            name: 'remove_spec',
            arguments: { specId },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.success).toBe(true)
        expect(data.specId).toBe(specId)
    })

    test('making subsequent calls with unloaded specId returns error', async () => {
        await client.callTool({
            name: 'remove_spec',
            arguments: { specId },
        })

        const result = await client.callTool({
            name: 'find_operations',
            arguments: { specId, query: 'pet' },
        })
        expect(result.isError).toBe(true)
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'remove_spec',
            arguments: { specId: crypto.randomUUID() },
        })
        expect(result.isError).toBe(true)
    })
})

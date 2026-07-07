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

describe('get_path', () => {
    test('retrieves operations for a valid path', async () => {
        const result = await client.callTool({
            name: 'get_path',
            arguments: { specId, path: '/pet/{petId}' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data).toHaveLength(3)
        expect(data[0]).toMatchObject({ method: 'GET', operationId: 'getPetById' })
        expect(data[1]).toMatchObject({ method: 'POST', operationId: 'updatePetWithForm' })
        expect(data[2]).toMatchObject({ method: 'DELETE', operationId: 'deletePet' })
    })

    test('returns error for non-existent path', async () => {
        const result = await client.callTool({
            name: 'get_path',
            arguments: { specId, path: '/nonexistent' },
        })
        expect(result.isError).toBe(true)
        const text = (result.content as { text: string }[])[0]!.text
        expect(text).toContain('No operations found for path "/nonexistent"')
    })

    test('returns single operation path', async () => {
        const result = await client.callTool({
            name: 'get_path',
            arguments: { specId, path: '/store/inventory' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data).toHaveLength(1)
        expect(data[0]).toMatchObject({ method: 'GET', operationId: 'getInventory' })
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'get_path',
            arguments: { specId: crypto.randomUUID(), path: '/pet/{petId}' },
        })
        expect(result.isError).toBe(true)
    })
})

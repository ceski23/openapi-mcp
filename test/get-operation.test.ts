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

describe('get_operation', () => {
    test('retrieves operation by operationId', async () => {
        const result = await client.callTool({
            name: 'get_operation',
            arguments: { specId, operationId: 'getPetById' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.method).toBe('GET')
        expect(data.path).toBe('/pet/{petId}')
        expect(data.operationId).toBe('getPetById')
        expect(data.parameters).toBeDefined()
        expect(data.parameters).toHaveLength(1)
        expect(data.parameters[0].name).toBe('petId')
    })

    test('returns error for non-existent operationId', async () => {
        const result = await client.callTool({
            name: 'get_operation',
            arguments: { specId, operationId: 'nonexistentOperation' },
        })
        expect(result.isError).toBe(true)
        const text = (result.content as { text: string }[])[0]!.text
        expect(text).toContain('No operation found with operationId "nonexistentOperation"')
    })

    test('retrieves operation with request body', async () => {
        const result = await client.callTool({
            name: 'get_operation',
            arguments: { specId, operationId: 'addPet' },
        })
        const data = JSON.parse((result.content as { text: string }[])[0]!.text)
        expect(data.method).toBe('POST')
        expect(data.path).toBe('/pet')
        expect(data.requestBody).toBeDefined()
    })

    test('returns error for invalid specId', async () => {
        const result = await client.callTool({
            name: 'get_operation',
            arguments: { specId: crypto.randomUUID(), operationId: 'getPetById' },
        })
        expect(result.isError).toBe(true)
    })
})

import { test, expect, describe, beforeAll } from 'bun:test'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createTestContext } from './setup'

describe('list_cached_specs tool', () => {
    let client: Client

    beforeAll(async () => {
        const ctx = await createTestContext()
        client = ctx.client
    })

    test('returns cached specs after loading', async () => {
        await client.callTool({
            name: 'load_spec',
            arguments: { source: 'test/fixtures/petstore.json' },
        })
        await client.callTool({
            name: 'load_spec',
            arguments: { source: 'test/fixtures/petstore-v2.json' },
        })

        const result = await client.callTool({
            name: 'list_cached_specs',
            arguments: {},
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.count).toBeGreaterThanOrEqual(2)
        const sources = output.specs.map((s: { source: string }) => s.source)
        expect(sources).toContain('test/fixtures/petstore.json')
        expect(sources).toContain('test/fixtures/petstore-v2.json')

        for (const spec of output.specs) {
            expect(spec.specId).toBeDefined()
            expect(spec.source).toBeDefined()
            expect(spec.loadedAt).toBeDefined()
        }
    })
})

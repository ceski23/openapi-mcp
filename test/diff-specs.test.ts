import { test, expect, describe, beforeAll } from 'bun:test'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createTestContext } from './setup'

describe('diff_specs tool', () => {
    let client: Client
    let specIdA: string
    let specIdB: string

    beforeAll(async () => {
        const ctx = await createTestContext()
        client = ctx.client

        const resultA = await client.callTool({
            name: 'load_spec',
            arguments: { source: 'test/fixtures/petstore.json' },
        })
        const textA = (resultA.content as { text: string }[])[0]!.text
        specIdA = JSON.parse(textA).specId as string

        const resultB = await client.callTool({
            name: 'load_spec',
            arguments: { source: 'test/fixtures/petstore-v2.json' },
        })
        const textB = (resultB.content as { text: string }[])[0]!.text
        specIdB = JSON.parse(textB).specId as string
    })

    test('returns detailed diff between two different specs', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: specIdA, compare: specIdB },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.hasChanges).toBe(true)
        expect(output.summary.endpoints.added).toBe(1)
        expect(output.summary.endpoints.modified).toBeGreaterThanOrEqual(1)
        expect(output.summary.paths.added).toBe(1)

        expect(output.diff.paths.added).toContain('/pet/search')

        const modified = output.diff.paths.modified
        expect(modified['/pet/findByStatus']).toBeDefined()
        expect(modified['/pet/{petId}']).toBeDefined()
    })

    test('format=summary returns only hasChanges and summary', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: specIdA, compare: specIdB, format: 'summary' },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.hasChanges).toBe(true)
        expect(output.summary.endpoints.added).toBe(1)
        expect(output.diff).toBeUndefined()
    })

    test('returns empty diff when comparing spec to itself', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: specIdA, compare: specIdA },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.hasChanges).toBe(false)
    })

    test('invalid specId returns error', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: 'invalid-id', compare: specIdB },
        })
        expect(result.isError).toBe(true)
    })

    test('description changes are detected in paths', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: specIdA, compare: specIdB },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        const getEndpoint = output.diff.paths.modified['/pet/{petId}']
        const descriptionChange = getEndpoint.operations.modified.GET.description
        expect(descriptionChange.from).toBe('Returns a single pet.')
        expect(descriptionChange.to).toBe('Returns a single pet by ID.')
    })

    test('returns markdown changelog with format=markdown', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: specIdA, compare: specIdB, format: 'markdown' },
        })
        const text = (result.content as { text: string }[])[0]!.text

        expect(text).toContain('# API Changelog')
        expect(text).toContain('/pet/search')
        expect(text).toContain('endpoint added')
    })

    test('returns empty changelog when comparing spec to itself with format=markdown', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: specIdA, compare: specIdA, format: 'markdown' },
        })
        const text = (result.content as { text: string }[])[0]!.text

        expect(text).toMatch(/No changes detected/u)
    })

    test('invalid specId returns error for markdown format', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: 'invalid-id', compare: specIdB, format: 'markdown' },
        })
        expect(result.isError).toBe(true)
    })

    test('accepts source as alternative to specId', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: {
                base: 'test/fixtures/petstore.json',
                compare: 'test/fixtures/petstore-v2.json',
            },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.hasChanges).toBe(true)
        expect(output.summary.endpoints.added).toBe(1)
        expect(output.diff.paths.added).toContain('/pet/search')
    })

    test('accepts mixed specId and source', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: {
                base: specIdA,
                compare: 'test/fixtures/petstore-v2.json',
            },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.hasChanges).toBe(true)
        expect(output.summary.endpoints.added).toBe(1)
    })

    test('invalid source returns error', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: {
                base: 'test/fixtures/non-existent.json',
                compare: 'test/fixtures/petstore-v2.json',
            },
        })
        expect(result.isError).toBe(true)
    })

    test('specId takes priority when same string matches both specId and source', async () => {
        const result = await client.callTool({
            name: 'diff_specs',
            arguments: { base: specIdA, compare: specIdB },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.hasChanges).toBe(true)
        expect(output.diff.paths.added).toContain('/pet/search')
    })
})

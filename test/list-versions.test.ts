import { test, expect, describe, beforeAll, afterAll } from 'bun:test'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createTestContext } from './setup'

describe('list_versions tool', () => {
    let client: Client
    let specIdFirst: string
    let specIdSecond: string
    const uniqueFixture = join(import.meta.dir, 'fixtures', `petstore-unique-${Date.now()}.json`)

    beforeAll(async () => {
        try {
            unlinkSync(uniqueFixture)
        } catch {}
        const ctx = await createTestContext()
        client = ctx.client

        writeFileSync(
            uniqueFixture,
            JSON.stringify({
                openapi: '3.0.4',
                info: { title: 'Unique Test', version: '1.0.0' },
                paths: {},
                components: { schemas: {} },
            }),
        )

        const resultFirst = await client.callTool({
            name: 'load_spec',
            arguments: { source: uniqueFixture },
        })
        const textFirst = (resultFirst.content as { text: string }[])[0]!.text
        specIdFirst = JSON.parse(textFirst).specId as string

        const resultSecond = await client.callTool({
            name: 'load_spec',
            arguments: { source: uniqueFixture },
        })
        const textSecond = (resultSecond.content as { text: string }[])[0]!.text
        specIdSecond = JSON.parse(textSecond).specId as string
    })

    afterAll(() => {
        try {
            unlinkSync(uniqueFixture)
        } catch {}
    })

    test('after loading same source twice, history has one entry', async () => {
        const result = await client.callTool({
            name: 'list_versions',
            arguments: { specId: specIdSecond },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.source).toBe(uniqueFixture)
        expect(output.current.specId).toBe(specIdSecond)
        expect(output.history).toHaveLength(1)
        expect(output.history[0].specId).toBe(specIdFirst)
    })

    test('history references the first load', async () => {
        const result = await client.callTool({
            name: 'list_versions',
            arguments: { specId: specIdSecond },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(new Date(output.history[0].loadedAt).getTime()).toBeGreaterThan(0)
    })

    test('invalid specId returns error', async () => {
        const result = await client.callTool({
            name: 'list_versions',
            arguments: { specId: 'nonexistent-id' },
        })
        expect(result.isError).toBe(true)
    })

    test('first load of a source has no previousVersion in response', async () => {
        const result = await client.callTool({
            name: 'load_spec',
            arguments: { source: uniqueFixture },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.previousVersion).toBeDefined()
        expect(output.versions).toBeGreaterThanOrEqual(3)
    })

    test('current and history entries include spec version', async () => {
        const result = await client.callTool({
            name: 'list_versions',
            arguments: { specId: specIdSecond },
        })
        const output = JSON.parse((result.content as { text: string }[])[0]!.text)

        expect(output.current.version).toBe('1.0.0')
        expect(output.history[0].version).toBe('1.0.0')
    })
})

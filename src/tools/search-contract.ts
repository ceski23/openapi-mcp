import { z } from 'zod'
import Fuse from 'fuse.js'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool, iterateOperations } from '../utils'
import { isSchema } from 'oas/types'
import type { OASDocument, SchemaObject } from 'oas/types'

type SchemaDoc = {
    name: string
    description: string
    propertyNames: string[]
    propertyDescriptions: string[]
    enumValues: string[]
}

function buildSchemaDocs(spec: OASDocument): SchemaDoc[] {
    const schemas = spec.components?.schemas ?? {}
    const entries = Object.entries(schemas)

    return entries
        .filter((entry): entry is [string, SchemaObject] => isSchema(entry[1]))
        .map(([name, schema]) => {
            const doc: SchemaDoc = {
                name,
                description: schema.description ?? '',
                propertyNames: [],
                propertyDescriptions: [],
                enumValues: [],
            }

            if (schema.enum) doc.enumValues.push(...schema.enum.map(String))

            const props = schema.properties
            if (props && typeof props === 'object') {
                for (const [propName, prop] of Object.entries(props)) {
                    doc.propertyNames.push(propName)

                    if (isSchema(prop)) {
                        if (prop.description) doc.propertyDescriptions.push(prop.description)
                        if (prop.enum) doc.enumValues.push(...prop.enum.map(String))
                    }
                }
            }

            return doc
        })
}

export const searchContract = defineTool({
    name: 'search_contract',
    description:
        'Search across the entire API contract — operations and schemas — by matching against operationIds, summaries, tags, paths, schema names, schema descriptions, property names, property descriptions, and enum values. The best first call when exploring an API.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec'),
        query: z
            .string()
            .describe(
                'Search query to match against operationIds, summaries, tags, paths, schema names, schema descriptions, property names, property descriptions, and enum values',
            ),
        page: z.number().int().min(1).optional().default(1).describe('Page number (1-indexed).'),
        limit: z
            .number()
            .int()
            .min(1)
            .optional()
            .default(20)
            .describe(
                'Maximum number of results per page (applied to both operations and schemas).',
            ),
    }),
    execute: ({ specId, query, page = 1, limit = 20 }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const operationDocs = iterateOperations(spec)
            .map(({ path, method, operation }) => ({
                operationId: operation.operationId ?? '',
                method,
                path,
                tags: operation.tags ?? [],
                summary: operation.summary ?? '',
                description: operation.description ?? '',
            }))
            .toArray()

        const fuseOps = new Fuse(operationDocs, {
            keys: [
                { name: 'operationId', weight: 2 },
                { name: 'path', weight: 1 },
                { name: 'summary', weight: 1 },
                { name: 'description', weight: 0.5 },
                { name: 'tags', weight: 1 },
            ],
            threshold: 0.4,
        })

        const allOperations = fuseOps.search(query).map((result) => ({
            operationId: result.item.operationId,
            method: result.item.method,
            path: result.item.path,
            ...(result.item.tags.length > 0 ? { tags: result.item.tags } : {}),
            ...(result.item.summary ? { summary: result.item.summary } : {}),
        }))

        const schemaDocs = buildSchemaDocs(spec)
        const fuseSchemas = new Fuse(schemaDocs, {
            keys: [
                { name: 'name', weight: 2 },
                { name: 'description', weight: 1 },
                { name: 'propertyNames', weight: 1 },
                { name: 'propertyDescriptions', weight: 0.5 },
                { name: 'enumValues', weight: 1 },
            ],
            threshold: 0.4,
        })

        const allSchemas = fuseSchemas
            .search(query)
            .map((result) => result.item.name)
            .toSorted()

        const totalOperations = allOperations.length
        const totalSchemas = allSchemas.length
        const start = (page - 1) * limit
        const operations = allOperations.slice(start, start + limit)
        const schemas = allSchemas.slice(start, start + limit)

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify(
                        {
                            page,
                            limit,
                            totalOperations,
                            totalSchemas,
                            ...(operations.length > 0 ? { operations } : {}),
                            ...(schemas.length > 0 ? { schemas } : {}),
                        },
                        null,
                        2,
                    ),
                },
            ],
        }
    },
})

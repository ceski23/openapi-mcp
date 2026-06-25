import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool, iterateOperations, matchesQuery } from '../utils'

export const searchContract = defineTool({
    name: 'search_contract',
    description:
        'Search across the entire API contract — operations and schemas — by matching against operationIds, summaries, tags, paths, schema names, and schema descriptions. The best first call when exploring an API.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec'),
        query: z
            .string()
            .describe(
                'Search query to match against operationIds, summaries, tags, paths, schema names, and schema descriptions',
            ),
    }),
    execute: ({ specId, query }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const lowercaseQuery = query.toLowerCase()

        const operations = iterateOperations(spec)
            .filter(({ path, operation }) => matchesQuery(operation, path, lowercaseQuery))
            .map(({ path, method, operation }) => ({
                operationId: operation.operationId ?? '',
                method,
                path,
                ...(operation.summary ? { summary: operation.summary } : {}),
            }))
            .toArray()

        const schemas = Object.keys(spec.components?.schemas ?? {})
            .filter((name) => {
                const schema = spec.components?.schemas?.[name]
                if (!schema) return false
                if ('$ref' in schema) return false
                return (
                    name.toLowerCase().includes(lowercaseQuery) ||
                    (schema.description ?? '').toLowerCase().includes(lowercaseQuery)
                )
            })
            .toSorted()

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify(
                        {
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

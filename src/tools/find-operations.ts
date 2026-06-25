import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool, iterateOperations, matchesQuery } from '../utils'

export const findOperations = defineTool({
    name: 'find_operations',
    description:
        'Search for API operations in the loaded spec by matching against operationId, path, summary, tags, and descriptions. Use when you know approximately what you need but not the exact endpoint.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec'),
        query: z
            .string()
            .describe('Search query to match against operation names, paths, summaries, and tags'),
    }),
    execute: ({ specId, query }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const lowercaseQuery = query.toLowerCase()
        const results = iterateOperations(spec)
            .filter(({ path, operation }) => matchesQuery(operation, path, lowercaseQuery))
            .map(({ path, method, operation }) => ({
                operationId: operation.operationId ?? '',
                method,
                path,
                ...(operation.summary ? { summary: operation.summary } : {}),
            }))
            .toArray()

        return {
            content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        }
    },
})

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
            .optional()
            .describe(
                'Search query to match against operation names, paths, summaries, and tags. Omit or leave empty to return EVERY operation in the spec — can be thousands of results on large APIs. Pair with `tags` or `methods` to narrow down before omitting query.',
            ),
        tags: z
            .array(z.string())
            .optional()
            .describe(
                'Filter to operations that have at least one of the listed tags (e.g. ["pet", "store"]).',
            ),
        methods: z
            .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE']))
            .optional()
            .describe('Filter to operations with any of the listed HTTP methods.'),
        page: z.number().int().min(1).optional().default(1).describe('Page number (1-indexed).'),
        limit: z
            .number()
            .int()
            .min(1)
            .optional()
            .default(50)
            .describe('Maximum number of results per page.'),
    }),
    execute: ({ specId, query, tags, methods, page = 1, limit = 50 }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const lowercaseQuery = query?.toLowerCase()
        const lowercaseTags = tags?.map((t) => t.toLowerCase())

        const allResults = iterateOperations(spec)
            .filter(({ path, method, operation }) => {
                if (lowercaseQuery && !matchesQuery(operation, path, lowercaseQuery)) {
                    return false
                }

                if (lowercaseTags && lowercaseTags.length > 0) {
                    const operationTags = (operation.tags ?? []).map((t) => t.toLowerCase())
                    if (!operationTags.some((tag) => lowercaseTags.includes(tag))) return false
                }

                if (methods && methods.length > 0 && !methods.includes(method as any)) {
                    return false
                }

                return true
            })
            .map(({ path, method, operation }) => ({
                operationId: operation.operationId ?? '',
                method,
                path,
                ...(operation.tags ? { tags: operation.tags } : {}),
                ...(operation.summary ? { summary: operation.summary } : {}),
            }))
            .toArray()

        const total = allResults.length
        const start = (page - 1) * limit
        const results = allResults.slice(start, start + limit)

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify(
                        {
                            total,
                            page,
                            limit,
                            results,
                        },
                        null,
                        2,
                    ),
                },
            ],
        }
    },
})

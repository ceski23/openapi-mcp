import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const findSchemas = defineTool({
    name: 'find_schemas',
    description:
        'Search component/definition schema names in the loaded spec by matching against schema names. Use when you know approximately what a schema is called but not the exact name.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec'),
        query: z
            .string()
            .optional()
            .describe(
                'Search query to match against schema/definition names. Omit or leave empty to return EVERY schema in the spec — can be thousands of results on large APIs.',
            ),
        page: z.number().int().min(1).optional().default(1).describe('Page number (1-indexed).'),
        limit: z
            .number()
            .int()
            .min(1)
            .optional()
            .default(50)
            .describe('Maximum number of results per page.'),
    }),
    execute: ({ specId, query, page = 1, limit = 50 }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const schemas = spec.components?.schemas

        if (!schemas || Object.keys(schemas).length === 0) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: 'No schemas found in the loaded spec.',
                    },
                ],
            }
        }

        const entries = Object.entries(schemas) as Array<[string, (typeof schemas)[string]]>
        const lowercaseQuery = query?.toLowerCase()
        const allResults = entries
            .filter(([name]) =>
                lowercaseQuery ? name.toLowerCase().includes(lowercaseQuery) : true,
            )
            .map(([name, schema]) => ({
                name,
                ...(!('$ref' in schema) && schema.type ? { type: schema.type } : {}),
                ...(!('$ref' in schema) && schema.description
                    ? { description: schema.description }
                    : {}),
            }))
            .toSorted((a, b) => a.name.localeCompare(b.name))

        const total = allResults.length
        const start = (page - 1) * limit
        const results = allResults.slice(start, start + limit)

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({
                        total,
                        page,
                        limit,
                        results,
                    }),
                },
            ],
        }
    },
})

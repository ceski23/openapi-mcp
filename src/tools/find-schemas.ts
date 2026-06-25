import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const findSchemas = defineTool({
    name: 'find_schemas',
    description:
        'Search component/definition schema names in the loaded spec by matching against schema names. Use when you know approximately what a schema is called but not the exact name.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec'),
        query: z.string().describe('Search query to match against schema/definition names'),
    }),
    execute: ({ specId, query }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const schemas = spec.components?.schemas
        const keys = Object.keys(schemas ?? {})

        const lowercaseQuery = query.toLowerCase()
        const results = keys
            .filter((name) => name.toLowerCase().includes(lowercaseQuery))
            .toSorted()

        return {
            content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        }
    },
})

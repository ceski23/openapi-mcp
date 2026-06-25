import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const getPath = defineTool({
    name: 'get_path',
    description:
        'Retrieve all operations (GET, POST, PATCH, DELETE, etc.) for a specific path. Use when you know the exact path and want the full contract for all methods on it.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec'),
        path: z.string().describe('The exact path from the spec (e.g. /customers/{id})'),
    }),
    execute: ({ specId, path }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const pathItem = spec.paths?.[path]
        if (!pathItem) {
            return {
                content: [
                    { type: 'text' as const, text: `No operations found for path "${path}".` },
                ],
                isError: true,
            }
        }

        return {
            content: [{ type: 'text' as const, text: JSON.stringify(pathItem, null, 2) }],
        }
    },
})

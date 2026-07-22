import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool, iteratePathItem } from '../utils'

export const getPath = defineTool({
    name: 'get_path',
    description:
        'Retrieve all operations (GET, POST, PATCH, DELETE, etc.) for a specific path. Returns a summary of each method on the path. Use get_operation with the operationId for full details.',
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

        const operations = iteratePathItem(path, pathItem)
            .map(({ method, operation }) => ({
                method,
                operationId: operation.operationId ?? '',
                ...(operation.tags ? { tags: operation.tags } : {}),
                ...(operation.summary ? { summary: operation.summary } : {}),
            }))
            .toArray()

        return {
            content: [{ type: 'text' as const, text: JSON.stringify(operations) }],
        }
    },
})

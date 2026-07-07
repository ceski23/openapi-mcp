import { z } from 'zod'
import { removeSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const unloadSpec = defineTool({
    name: 'unload_spec',
    description:
        'Remove a loaded spec and its version history from the cache by specId. Useful for managing memory or cleaning up stale specs.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec to remove from cache'),
    }),
    execute: ({ specId }) => {
        const removed = removeSpec(specId)

        if (!removed) return MISSING_SPEC_RESPONSE

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({ success: true, specId }),
                },
            ],
        }
    },
})

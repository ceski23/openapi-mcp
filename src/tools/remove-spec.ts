import { z } from 'zod'
import { removeSpec as removeSpecFromCache } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const removeSpec = defineTool({
    name: 'remove_spec',
    title: 'Remove Spec',
    description:
        'Remove a loaded spec and its version history from the cache by specId. Returns {success, specId}. Useful for managing memory or cleaning up stale specs.',
    inputSchema: z
        .object({
            specId: z
                .string()
                .meta({ title: 'Spec ID' })
                .describe('The spec ID returned by load_spec to remove from cache'),
        })
        .strict()
        .meta({ title: 'Remove Spec Parameters' }),
    execute: ({ specId }) => {
        const removed = removeSpecFromCache(specId)

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

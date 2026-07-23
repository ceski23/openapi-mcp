import { z } from 'zod'
import { getAllCachedSpecs } from '../cache'
import { defineTool } from '../utils'

export const listCachedSpecs = defineTool({
    name: 'list_cached_specs',
    title: 'List Cached Specs',
    description:
        'List all currently cached OpenAPI specs with their specIds, sources, titles, and versions.',
    inputSchema: z.object({}).strict().meta({ title: 'List Cached Specs Parameters' }),
    execute: () => {
        const specs = getAllCachedSpecs()

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({
                        count: specs.length,
                        specs: specs.map((spec) => ({
                            specId: spec.specId,
                            source: spec.source,
                            loadedAt: spec.loadedAt,
                            title: spec.title,
                            version: spec.version,
                        })),
                    }),
                },
            ],
        }
    },
})

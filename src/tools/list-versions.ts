import { z } from 'zod'
import { getSpec, getVersions } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const listVersions = defineTool({
    name: 'list_versions',
    title: 'List Versions',
    description:
        'List all cached versions for a specId. When the same source URL/path is loaded multiple times via load_spec, previous versions are tracked and can be listed here.',
    inputSchema: z
        .object({
            specId: z
                .string()
                .meta({ title: 'Spec ID' })
                .describe('Spec ID from load_spec to look up version history for'),
        })
        .strict()
        .meta({ title: 'List Versions Parameters' }),
    execute: ({ specId }) => {
        const cached = getSpec(specId)
        if (!cached) return MISSING_SPEC_RESPONSE

        const versions = getVersions(cached.source)
        const currentVersion = cached.oas?.getDefinition()?.info?.version

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({
                        source: cached.source,
                        current: {
                            specId,
                            loadedAt: cached.loadedAt,
                            ...(currentVersion ? { version: currentVersion } : {}),
                        },
                        history: versions.map((version) => ({
                            specId: version.specId,
                            loadedAt: version.loadedAt,
                            ...(version.definition?.info?.version
                                ? { version: version.definition.info.version }
                                : {}),
                        })),
                    }),
                },
            ],
        }
    },
})

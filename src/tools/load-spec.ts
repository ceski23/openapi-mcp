import { z } from 'zod'
import OASNormalize from 'oas-normalize'
import Oas from 'oas'
import { setSpec, getSpecBySource, pushVersion, setSourceMapping, getVersions } from '../cache'
import { defineTool } from '../utils'

export const loadSpec = defineTool({
    name: 'load_spec',
    description:
        'Load and parse an OpenAPI/Swagger specification from a URL or local file path. Parses and validates the spec, returning a specId for use by other tools.',
    inputSchema: z.object({
        source: z
            .string()
            .describe('URL or local file path to the OpenAPI/Swagger specification (JSON or YAML)'),
    }),
    execute: async ({ source }) => {
        try {
            const normalizer = new OASNormalize(source, { enablePaths: true })

            const converted = await normalizer.convert()
            const oas = Oas.init(converted as Record<string, unknown>)
            await oas.dereference()
            const existing = getSpecBySource(source)

            const specId = crypto.randomUUID()
            setSpec(specId, { oas, source, loadedAt: new Date().toISOString() })

            if (existing?.spec.oas) {
                pushVersion(source, {
                    specId: existing.specId,
                    definition: existing.spec.oas.getDefinition(),
                    loadedAt: existing.spec.loadedAt,
                })
            }

            setSourceMapping(source, specId)

            const spec = oas.getDefinition()
            const endpointCount = Object.keys(spec.paths ?? {}).length
            const schemaCount = Object.keys(spec.components?.schemas ?? {}).length
            const versions = getVersions(source)

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: JSON.stringify(
                            {
                                success: true,
                                specId,
                                title: spec.info?.title,
                                version: spec.info?.version,
                                description: spec.info?.description,
                                endpoints: endpointCount,
                                schemas: schemaCount,
                                source,
                                previousVersion: existing
                                    ? {
                                          specId: existing.specId,
                                          loadedAt: existing.spec.loadedAt,
                                      }
                                    : undefined,
                                versions: versions.length + 1,
                            },
                            null,
                            2,
                        ),
                    },
                ],
            }
        } catch (error: unknown) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Failed to load spec: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            }
        }
    },
})

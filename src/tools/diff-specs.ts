import { tmpdir } from 'os'
import { join } from 'path'
import { z } from 'zod'
import { getSpec, getSpecBySource } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool, execPromise, TempFile } from '../utils'

const resolveSpecDef = (spec: string) => {
    const cached = getSpec(spec)
    if (cached) {
        return {
            specId: spec,
            definition: cached.oas?.getDefinition(),
        }
    }

    const bySource = getSpecBySource(spec)
    if (bySource) {
        return {
            specId: bySource.specId,
            definition: bySource.spec.oas?.getDefinition(),
        }
    }

    return null
}

export const diffSpecs = defineTool({
    name: 'diff_specs',
    title: 'Diff Specs',
    description:
        'Compare two loaded OpenAPI specs. Returns a structured diff (summary or detailed) or a human-readable markdown changelog. Requires oasdiff on PATH. Warning: the "detailed" format can produce very large output on sizable specs; prefer "summary" or "markdown" for a concise view.',
    inputSchema: z
        .object({
            base: z
                .string()
                .meta({ title: 'Base Spec' })
                .describe(
                    'Baseline spec (the "old" version). Pass a specId from load_spec, or a source URL/path to resolve to the latest cached load.',
                ),
            compare: z
                .string()
                .meta({ title: 'Compare Spec' })
                .describe(
                    'Comparison spec (the "new" version). Pass a specId from load_spec, or a source URL/path to resolve to the latest cached load.',
                ),
            format: z
                .enum(['detailed', 'summary', 'markdown'])
                .optional()
                .meta({ title: 'Format' })
                .default('markdown')
                .describe(
                    'Output format: "summary" for change counts only, "detailed" for full structured diff with path/component details, "markdown" for a human-readable changelog',
                ),
        })
        .strict()
        .meta({ title: 'Diff Specs Parameters' }),
    execute: async ({ base, compare, format }) => {
        const oasdiffAvailable = await execPromise('oasdiff --help').then(
            ({ stdout, stderr }) => stderr.trim() === '' && stdout.trim() !== '',
        )

        if (!oasdiffAvailable) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'oasdiff CLI is not available on PATH. Install it from https://github.com/oasdiff/oasdiff to use this tool.',
                    },
                ],
                isError: true,
            }
        }

        const definitionBase = resolveSpecDef(base)?.definition
        const definitionCompare = resolveSpecDef(compare)?.definition

        if (!definitionBase || !definitionCompare) {
            return MISSING_SPEC_RESPONSE
        }

        await using tmpBase = new TempFile(join(tmpdir(), `oasdiff-base-${Date.now()}.json`))
        await using tmpCompare = new TempFile(join(tmpdir(), `oasdiff-revision-${Date.now()}.json`))

        try {
            await Promise.all([
                tmpBase.write(JSON.stringify(definitionBase)),
                tmpCompare.write(JSON.stringify(definitionCompare)),
            ])

            if (format === 'markdown') {
                const { stdout } = await execPromise(
                    `oasdiff changelog "${tmpBase.path}" "${tmpCompare.path}" --format markdown`,
                )

                return {
                    content: [{ type: 'text', text: stdout.trim() }],
                }
            }

            const { stdout: summaryStdout } = await execPromise(
                `oasdiff summary "${tmpBase.path}" "${tmpCompare.path}" --format json`,
            )
            const summary = JSON.parse(summaryStdout.trim())

            const output: Record<string, unknown> = {
                hasChanges: summary.diff === true,
                summary: summary.details ?? {},
            }

            if (format === 'detailed') {
                const { stdout: diffStdout } = await execPromise(
                    `oasdiff diff "${tmpBase.path}" "${tmpCompare.path}" --format json`,
                )
                const diff = diffStdout.trim() ? JSON.parse(diffStdout.trim()) : null
                if (diff) {
                    output.diff = {
                        paths: diff.paths,
                        components: diff.components,
                    }
                }
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(output),
                    },
                ],
            }
        } catch (error: unknown) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Diff failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            }
        }
    },
})

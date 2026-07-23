import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const getSchema = defineTool({
    name: 'get_schema',
    title: 'Get Schema',
    description:
        'Retrieve a fully dereferenced component/definition schema by name. Use when you need the full structure of a specific schema. Returns the schema object with all its properties, types, and constraints.',
    inputSchema: z
        .object({
            specId: z
                .string()
                .meta({ title: 'Spec ID' })
                .describe('The spec ID returned by load_spec'),
            name: z
                .string()
                .meta({ title: 'Schema Name' })
                .describe('The schema/definition name (case-sensitive, e.g. Invoice)'),
        })
        .strict()
        .meta({ title: 'Get Schema Parameters' }),
    execute: ({ specId, name }) => {
        const cached = getSpec(specId)
        const spec = cached?.oas?.getDefinition()
        if (!spec) return MISSING_SPEC_RESPONSE

        const schema = spec.components?.schemas?.[name]

        if (!schema) {
            return {
                content: [{ type: 'text' as const, text: `No schema found with name "${name}".` }],
                isError: true,
            }
        }

        return {
            content: [{ type: 'text' as const, text: JSON.stringify(schema) }],
        }
    },
})

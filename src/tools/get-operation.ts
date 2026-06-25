import { z } from 'zod'
import { getSpec } from '../cache'
import { MISSING_SPEC_RESPONSE, defineTool } from '../utils'

export const getOperation = defineTool({
    name: 'get_operation',
    description:
        'Retrieve full details for a single API operation by operationId, including method, path, parameters, requestBody, and responses.',
    inputSchema: z.object({
        specId: z.string().describe('The spec ID returned by load_spec'),
        operationId: z.string().describe('The operationId of the endpoint to retrieve'),
    }),
    execute: ({ specId, operationId }) => {
        const cached = getSpec(specId)
        const oas = cached?.oas
        if (!oas) return MISSING_SPEC_RESPONSE

        const operation = oas.getOperationById(operationId)

        if (!operation) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `No operation found with operationId "${operationId}".`,
                    },
                ],
                isError: true,
            }
        }

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify(
                        {
                            method: operation.method.toUpperCase(),
                            path: operation.path,
                            ...operation.schema,
                        },
                        null,
                        2,
                    ),
                },
            ],
        }
    },
})

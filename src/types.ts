import type { z } from 'zod'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

export type ToolDefinition<InputArgs extends z.ZodType = z.ZodType> = {
    name: string
    title: string
    description: string
    inputSchema: InputArgs
    execute: (args: z.infer<InputArgs>) => CallToolResult | Promise<CallToolResult>
}

import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ToolDefinition } from './types'
import type { OASDocument, OperationObject } from 'oas/types'
import type { z } from 'zod'
import { writeFile, unlink } from 'node:fs/promises'
import { promisify } from 'node:util'
import { exec } from 'node:child_process'

export const execPromise = promisify(exec)

export type OperationEntry = {
    path: string
    method: string
    operation: OperationObject
}

export const MISSING_SPEC_RESPONSE: CallToolResult = {
    content: [
        {
            type: 'text',
            text: 'Spec not found. The specId may be invalid or expired. Use load_spec to load a spec.',
        },
    ],
    isError: true,
}

export type PathItemMethods = {
    get?: OperationObject
    put?: OperationObject
    post?: OperationObject
    delete?: OperationObject
    options?: OperationObject
    head?: OperationObject
    patch?: OperationObject
    trace?: OperationObject
}

export function* iteratePathItem(
    path: string,
    pathItem: PathItemMethods,
): Generator<OperationEntry> {
    if (pathItem.get) yield { path, method: 'GET', operation: pathItem.get }
    if (pathItem.put) yield { path, method: 'PUT', operation: pathItem.put }
    if (pathItem.post) yield { path, method: 'POST', operation: pathItem.post }
    if (pathItem.delete) yield { path, method: 'DELETE', operation: pathItem.delete }
    if (pathItem.options) yield { path, method: 'OPTIONS', operation: pathItem.options }
    if (pathItem.head) yield { path, method: 'HEAD', operation: pathItem.head }
    if (pathItem.patch) yield { path, method: 'PATCH', operation: pathItem.patch }
    if (pathItem.trace) yield { path, method: 'TRACE', operation: pathItem.trace }
}

export function* iterateOperations(spec: OASDocument): Generator<OperationEntry> {
    if (!spec.paths || typeof spec.paths !== 'object') return
    for (const path of Object.keys(spec.paths)) {
        const pathItem = spec.paths[path]
        if (!pathItem) continue
        yield* iteratePathItem(path, pathItem)
    }
}

export const matchesQuery = (
    operation: OperationObject,
    path: string,
    lowercaseQuery: string,
): boolean =>
    (operation.operationId ?? '').toLowerCase().includes(lowercaseQuery) ||
    path.toLowerCase().includes(lowercaseQuery) ||
    (operation.summary ?? '').toLowerCase().includes(lowercaseQuery) ||
    (operation.description ?? '').toLowerCase().includes(lowercaseQuery) ||
    (operation.tags ?? []).join(' ').toLowerCase().includes(lowercaseQuery)

export class TempFile implements AsyncDisposable {
    constructor(readonly path: string) {}

    async write(data: string): Promise<void> {
        await writeFile(this.path, data)
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await unlink(this.path).catch(() => {})
    }
}

export const defineTool = <InputArgs extends z.ZodType>(tool: ToolDefinition<InputArgs>) => tool

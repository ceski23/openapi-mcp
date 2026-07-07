import { LRUCache } from 'lru-cache'
import type Oas from 'oas'
import type { OASDocument } from 'oas/types'

export type CachedSpec = {
    oas: Oas | null
    source: string
    loadedAt: string
}

export type VersionEntry = {
    specId: string
    definition: OASDocument
    loadedAt: string
}

type SourceEntry = {
    specId: string
    history: VersionEntry[]
}

const specCache = new LRUCache<string, CachedSpec>({
    max: 10,
    ttl: 1000 * 60 * 60 * 8,
    dispose: (value, key) => {
        const current = sourceIndex.get(value.source)
        if (current?.specId === key) {
            sourceIndex.delete(value.source)
        }
    },
})

const sourceIndex = new Map<string, SourceEntry>()

export const setSpec = (id: string, spec: CachedSpec) => specCache.set(id, spec)

export const getSpec = (id: string): CachedSpec | undefined => specCache.get(id)

export const getSpecBySource = (source: string) => {
    const entry = sourceIndex.get(source)
    if (!entry) return

    const spec = getSpec(entry.specId)
    if (!spec) return

    return {
        specId: entry.specId,
        spec,
    }
}

export const setSourceMapping = (source: string, specId: string) => {
    const existing = sourceIndex.get(source)

    sourceIndex.set(source, { specId, history: existing?.history ?? [] })
}

export const pushVersion = (source: string, entry: VersionEntry) => {
    const existing = sourceIndex.get(source)

    if (!existing) {
        sourceIndex.set(source, { specId: entry.specId, history: [] })
        return
    }

    existing.history.push(entry)

    if (existing.history.length > 5) {
        existing.history.shift()
    }
}

export const getVersions = (source: string): VersionEntry[] => {
    return sourceIndex.get(source)?.history ?? []
}

}

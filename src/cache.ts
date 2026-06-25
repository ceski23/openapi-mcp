import { LRUCache } from 'lru-cache'
import type Oas from 'oas'

export type CachedSpec = {
    oas: Oas | null
}

const specCache = new LRUCache<string, CachedSpec>({
    max: 10,
    ttl: 1000 * 60 * 60,
})

export function setSpec(id: string, spec: CachedSpec): void {
    specCache.set(id, spec)
}

export function getSpec(id: string): CachedSpec | undefined {
    return specCache.get(id)
}

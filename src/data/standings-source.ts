/*
  Every read of standings data goes through here. Files are plain static assets
  served under the app base path, so there is no client-side caching or TTL
  logic to write: freshness is the pipeline's responsibility.
*/

import type { MockIndex } from '../types/mock-index'
import type { StandingsFile } from '../types/standings'
import { resolveAssetUrl } from './asset-url'

const MOCK_DIR = 'data/mock/'

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(resolveAssetUrl(path), { signal })
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status} ${response.statusText})`)
  }
  return (await response.json()) as T
}

export function loadMockIndex(signal?: AbortSignal): Promise<MockIndex> {
  return fetchJson<MockIndex>(`${MOCK_DIR}index.json`, signal)
}

export function loadMockSnapshot(file: string, signal?: AbortSignal): Promise<StandingsFile> {
  return fetchJson<StandingsFile>(`${MOCK_DIR}${file}`, signal)
}

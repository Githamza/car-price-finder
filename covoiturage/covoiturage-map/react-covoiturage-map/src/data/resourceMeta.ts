import { RESOURCE_META_URL } from "../config";
import { RemoteResourceMeta } from "./tripCache";

/**
 * Fetches the data.gouv.fr resource metadata (CORS-open) used to decide
 * whether the cached trips are stale. Returns null on any failure — the
 * caller falls back to a time-based cache policy.
 */
export async function fetchResourceMeta(
  signal?: AbortSignal
): Promise<RemoteResourceMeta | null> {
  try {
    const response = await fetch(RESOURCE_META_URL, { signal });
    if (!response.ok) return null;
    const json = await response.json();
    return {
      checksum: json?.resource?.checksum?.value ?? null,
      lastModified: json?.resource?.last_modified ?? null,
      url: json?.resource?.url ?? null,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}

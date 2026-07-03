import { openDB, DBSchema } from "idb";
import { Trip } from "../types";

export interface TripCacheMeta {
  resourceId: string;
  checksum: string | null;
  rowCap: number;
  tripCount: number;
  storedAt: number; // epoch ms
}

export interface RemoteResourceMeta {
  checksum: string | null;
  lastModified: string | null;
  /** Direct static.data.gouv.fr URL — avoids the 503-prone redirect host */
  url: string | null;
}

interface TripCacheSchema extends DBSchema {
  trips: { key: number; value: Trip[] };
  meta: { key: string; value: TripCacheMeta };
}

const DB_NAME = "covoiturage-map";
const META_KEY = "meta";
const BATCH_SIZE = 25_000;
const OFFLINE_TTL_MS = 7 * 24 * 3600 * 1000;

function getDb() {
  return openDB<TripCacheSchema>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore("trips");
      db.createObjectStore("meta");
    },
  });
}

/**
 * Decides whether the cached trips can be used instead of re-streaming.
 * Pure so it can be unit-tested.
 */
export function isCacheValid(
  meta: TripCacheMeta,
  remote: RemoteResourceMeta | null,
  resourceId: string,
  maxTrips: number,
  now: number
): boolean {
  if (meta.resourceId !== resourceId) return false;

  // The cache was truncated at a cap lower than what we now want, and the
  // file actually had more rows — refetch to honour the bigger cap.
  if (meta.rowCap < maxTrips && meta.tripCount >= meta.rowCap) return false;

  if (remote?.checksum) return meta.checksum === remote.checksum;

  // Metadata API unreachable — accept a recent cache (graceful offline)
  return now - meta.storedAt < OFFLINE_TTL_MS;
}

export async function readCachedTrips(): Promise<{
  meta: TripCacheMeta;
  trips: Trip[];
} | null> {
  try {
    const db = await getDb();
    const meta = await db.get("meta", META_KEY);
    if (!meta) return null;
    const batches = await db.getAll("trips");
    const trips = batches.flat();
    return trips.length > 0 ? { meta, trips } : null;
  } catch {
    return null; // cache is best-effort
  }
}

export async function writeCachedTrips(
  trips: Trip[],
  meta: TripCacheMeta
): Promise<void> {
  try {
    const db = await getDb();
    await db.clear("trips");
    for (let i = 0; i * BATCH_SIZE < trips.length; i++) {
      await db.put(
        "trips",
        trips.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE),
        i
      );
    }
    await db.put("meta", meta, META_KEY);
  } catch {
    // cache is best-effort — never break loading over a storage error
  }
}

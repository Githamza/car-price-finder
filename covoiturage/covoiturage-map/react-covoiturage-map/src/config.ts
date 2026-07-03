// RPC open-data resource on data.gouv.fr (one CSV per month, 300-400 MB each)
export const RESOURCE_ID = "0a89f315-266b-497f-971b-ca40d1d79cf4";

export const CSV_URL = `https://www.data.gouv.fr/fr/datasets/r/${RESOURCE_ID}`;

// CORS-open metadata endpoint (checksum, last_modified) used for cache invalidation
export const RESOURCE_META_URL = `https://www.data.gouv.fr/api/2/datasets/resources/${RESOURCE_ID}/`;

// Row cap for the streamed CSV — the fetch is aborted once reached
export const MAX_TRIPS = Number(import.meta.env.VITE_MAX_TRIPS ?? 200_000);

// Hard cap on individually rendered trips in the current viewport
export const MAX_VISIBLE_TRIPS = 1_500;

// Zoom level at or above which individual trips replace clusters
export const MIN_ZOOM_FOR_TRIPS = 15;

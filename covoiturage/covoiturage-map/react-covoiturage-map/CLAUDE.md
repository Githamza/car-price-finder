# CLAUDE.md

Interactive map of French carpooling trips (covoiturage), built with React + TypeScript + Leaflet + Tailwind. Data comes from the French government's open-data "Registre de Preuve de Covoiturage" (RPC).

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build into `build/` (kept as `build/`, not `dist/`, because `deno.json` serves it via Deno Deploy's static file server)
- `npm run preview` — serve the production build locally
- `npm run tsc` — typecheck (`tsc --noEmit`); `npm run tsc:watch` for watch mode
- `npm test` — run vitest

## Architecture

- `src/index.tsx` — entry; StrictMode + `<TripDataProvider>`
- `src/App.tsx` — composes `Map`, `InfoPanel`, `MessageToast`; map stats flow up from `Map` via callback
- `src/config.ts` — data.gouv.fr URLs, `MAX_TRIPS` (env `VITE_MAX_TRIPS`, default 100k), `MAX_VISIBLE_TRIPS` (1500), `MIN_ZOOM_FOR_TRIPS` (15)
- `src/contexts/TripDataContext.tsx` — global state (trips, `progress {rows, done}`, stats, selected trip, toast messages) via `useTripData()`. Load flow: resource metadata → cache hit? hydrate : stream + write cache. `fetchTripData()` (refresh button) bypasses the cache.
- `src/data/` — `streamTrips.ts` (streaming fetch/parse, aborts at cap), `parseTrips.ts` (row→Trip with the real RPC columns), `tripCache.ts` (idb batches + `isCacheValid`), `resourceMeta.ts`, `sampleTrips.ts` (fallback)
- `src/hooks/useTripIndex.ts` — supercluster index over trip start points; throttled rebuilds during streaming; `isClusterFeature` type guard
- `src/components/Map.tsx` — react-leaflet with canvas renderer (`preferCanvas`). Clusters below zoom 15, individual trips (start marker + polyline + end marker) at 15+, capped at `MAX_VISIBLE_TRIPS`. One controlled `<Popup>` at map level — markers mount no popups.
- `src/utils/format.ts` — pure fr-FR formatters (kept out of the context)
- `src/types/index.ts` — shared types (`Trip`, `ClusterView`, `LoadProgress`, `Stats`, …)

## Data source (important)

- Dataset: "Trajets réalisés en covoiturage — Registre de Preuve de Covoiturage" on data.gouv.fr (dataset id `5e8ee97c16601da4ee24ffb7`). One CSV per month, each **300–400 MB** (~500–600k trips/month). Never download one whole-file into memory.
- The CSV is **semicolon-delimited** (`;`), quoted fields, header row. Real columns (verified live):
  `journey_id`, `trip_id`, `journey_start_datetime`, `journey_start_date`, `journey_start_time`, `journey_start_lon`, `journey_start_lat`, `journey_start_insee`, `journey_start_department`, `journey_start_town`, `journey_start_towngroup`, `journey_start_country`, `journey_end_*` (same shape), `passenger_seats`, `operator_class`, `journey_distance` (meters), `journey_duration` (minutes), `has_incentive` (OUI/NON).
  There is **no `operator` column** — only `operator_class` (A/B/C). Coordinates are truncated to ~3 decimals for anonymization.
- CORS: `static.data.gouv.fr` sends `Access-Control-Allow-Origin: *` and allows the `Range` header, so browser streaming/partial fetches work.
- data.gouv.fr's tabular (paginated JSON) API does **not** index these resources — files exceed its size limit. Don't try to paginate; stream instead.
- Resource metadata (checksum, `last_modified`, filesize) is available CORS-open at `https://www.data.gouv.fr/api/2/datasets/resources/<resource-id>/` — used to invalidate the local cache.

## Loading strategy

The CSV is stream-parsed progressively (fetch `ReadableStream` → `TextDecoder` → PapaParse per chunk), capped at `MAX_TRIPS` rows (env `VITE_MAX_TRIPS`), and the fetch is aborted once the cap is reached. Parsed trips are cached in IndexedDB so revisits load without hitting the network; cache is invalidated by resource checksum. The map renders progressively while streaming — do not reintroduce a blocking full-download or a blocking loading spinner.

## Gotchas

- Leaflet stays on **1.x** (react-leaflet targets it; Leaflet 2 is alpha).
- `react-leaflet` 5 requires React 19.
- The `build/` output directory name is load-bearing for `deno.json`.
- Trip popups: keep the single controlled `<Popup>` pattern — do not mount a `<Popup>` per marker (thousands of subtrees).
- `fadeAnimation` is disabled on the map: with StrictMode remounts, Leaflet's tile fade left tiles stuck at opacity 0.
- Do **not** fitBounds over the data — the dataset includes overseas/foreign trips, so data bounds center the map over the Middle East. The France default view is intentional.
- `www.data.gouv.fr` (redirect + metadata endpoints) 503s intermittently; the loader streams from the resource's direct `static.data.gouv.fr` URL when metadata is available and retries once. Keep failures non-fatal.
- Trips arrive ordered by datetime, so the row cap keeps the first ~N trips of the month (early February), not a spatial sample.
- UI copy is in **French**; number/date formatting uses `fr-FR` locale (see `src/utils/format.ts`).

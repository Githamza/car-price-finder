import { Bounds, Cluster, Trip } from "../types";

// Interim pure helpers extracted from the old context; replaced by a
// supercluster-based index in a later phase.

export function getTripsInBounds(trips: Trip[], bounds: Bounds): Trip[] {
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;

  return trips.filter(
    (trip) =>
      trip.journey_start_lat >= minLat &&
      trip.journey_start_lat <= maxLat &&
      trip.journey_start_lon >= minLng &&
      trip.journey_start_lon <= maxLng
  );
}

export function getTripClusters(
  trips: Trip[],
  bounds: Bounds,
  gridSize: number = 1
): Cluster[] {
  const tripsInBounds = getTripsInBounds(trips, bounds);
  const clusters: Record<string, Cluster> = {};

  tripsInBounds.forEach((trip) => {
    const latCell = Math.floor(trip.journey_start_lat / gridSize);
    const lonCell = Math.floor(trip.journey_start_lon / gridSize);
    const cellKey = `${latCell}:${lonCell}`;

    if (!clusters[cellKey]) {
      clusters[cellKey] = {
        count: 0,
        lat: (latCell + 0.5) * gridSize,
        lon: (lonCell + 0.5) * gridSize,
        trips: [],
      };
    }

    clusters[cellKey].count++;

    // Limit the number of trips stored per cluster to save memory
    if (clusters[cellKey].trips.length < 100) {
      clusters[cellKey].trips.push(trip);
    }
  });

  return Object.values(clusters);
}

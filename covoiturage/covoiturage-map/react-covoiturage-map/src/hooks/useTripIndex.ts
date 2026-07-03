import { useEffect, useRef, useState } from "react";
import Supercluster from "supercluster";
import { Trip } from "../types";
import { MIN_ZOOM_FOR_TRIPS } from "../config";

export interface TripPointProps {
  tripIndex: number;
  [key: string]: unknown;
}

export interface TripAggregates {
  sumDistance: number;
  [key: string]: unknown;
}

export type TripIndex = Supercluster<TripPointProps, TripAggregates>;

export function isClusterFeature(
  feature:
    | Supercluster.ClusterFeature<TripAggregates>
    | Supercluster.PointFeature<TripPointProps>
): feature is Supercluster.ClusterFeature<TripAggregates> {
  return (
    (feature.properties as Supercluster.ClusterProperties).cluster === true
  );
}

// Building a 100k-point index takes ~100-300 ms; throttle rebuilds while
// batches stream in so the main thread stays responsive.
const REBUILD_INTERVAL_MS = 1500;

/**
 * Maintains a supercluster spatial index over the trips' start points.
 * One index answers both "clusters in bbox at zoom Z" (low zoom) and
 * "individual trips in bbox" (zoom >= MIN_ZOOM_FOR_TRIPS).
 */
export function useTripIndex(trips: Trip[]): TripIndex | null {
  const [index, setIndex] = useState<TripIndex | null>(null);
  const lastBuildRef = useRef(0);

  useEffect(() => {
    if (trips.length === 0) {
      setIndex(null);
      return;
    }

    const build = () => {
      lastBuildRef.current = performance.now();
      const sc: TripIndex = new Supercluster({
        radius: 60,
        // Cluster only below the individual-trips zoom so queries at
        // MIN_ZOOM_FOR_TRIPS and above return raw points
        maxZoom: MIN_ZOOM_FOR_TRIPS - 1,
        map: (props): TripAggregates => ({
          sumDistance: trips[props.tripIndex].journey_distance,
        }),
        reduce: (acc, props) => {
          acc.sumDistance += props.sumDistance;
        },
      });
      sc.load(
        trips.map((trip, i) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [trip.journey_start_lon, trip.journey_start_lat],
          },
          properties: { tripIndex: i },
        }))
      );
      setIndex(sc);
    };

    const sinceLastBuild = performance.now() - lastBuildRef.current;
    if (sinceLastBuild >= REBUILD_INTERVAL_MS) {
      build();
      return;
    }
    const timer = setTimeout(build, REBUILD_INTERVAL_MS - sinceLastBuild);
    return () => clearTimeout(timer);
  }, [trips]);

  return index;
}

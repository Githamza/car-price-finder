import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LatLngBounds, PathOptions } from "leaflet";
import { useTripData } from "../contexts/TripDataContext";
import {
  formatDate,
  formatDistance,
  formatMonthFromTitle,
  formatNumber,
} from "../utils/format";
import {
  useTripIndex,
  IndexedTrips,
  isClusterFeature,
} from "../hooks/useTripIndex";
import { MIN_ZOOM_FOR_TRIPS, MAX_VISIBLE_TRIPS } from "../config";
import {
  MapProps,
  MapEventHandlerProps,
  TripPopupProps,
  Trip,
  ClusterView,
} from "../types";
import teamWheelsLogo from "../assets/images/logo.png";

// Center of France for initial map view
const DEFAULT_CENTER: [number, number] = [46.603354, 1.888334];
const DEFAULT_ZOOM = 6;

// The single controlled popup — content components mount only when open
type OpenPopup =
  | {
      kind: "trip";
      trip: Trip;
      isEndPoint: boolean;
      position: [number, number];
    }
  | { kind: "cluster"; cluster: ClusterView; position: [number, number] };

// Component to track map events and bounds
const MapEventHandler: React.FC<MapEventHandlerProps> = ({
  onBoundsChange,
  onZoomChange,
}) => {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  // Initialize bounds/zoom on mount — Leaflet's "load" event has already
  // fired by the time this handler is attached
  useEffect(() => {
    onBoundsChange(map.getBounds());
    onZoomChange(map.getZoom());
  }, [map, onBoundsChange, onZoomChange]);

  return null;
};

// Popup content for an individual trip
const TripPopup: React.FC<TripPopupProps> = ({ trip, isEndPoint }) => {
  return (
    <div className="popup-content">
      <h3>{isEndPoint ? "Destination" : "Départ"}</h3>
      {isEndPoint
        ? trip.journey_end_town && (
            <p className="font-medium text-blue-700">{trip.journey_end_town}</p>
          )
        : trip.journey_start_town && (
            <p className="font-medium text-blue-700">
              {trip.journey_start_town}
            </p>
          )}
      <p>
        <strong>Date:</strong> {formatDate(trip.datetime)}
      </p>
      <p>
        <strong>Distance:</strong> {formatDistance(trip.journey_distance)}
      </p>
      {!isEndPoint && trip.journey_end_town && (
        <p>
          <strong>Destination:</strong> {trip.journey_end_town}
        </p>
      )}
      {isEndPoint && trip.journey_start_town && (
        <p>
          <strong>Origine:</strong> {trip.journey_start_town}
        </p>
      )}
      {trip.operator_class && (
        <p>
          <strong>Classe d'opérateur:</strong> {trip.operator_class}
        </p>
      )}
      {trip.passenger_seats > 0 && (
        <p>
          <strong>Passagers:</strong> {trip.passenger_seats}
        </p>
      )}
      <p>
        <strong>Coordonnées GPS:</strong>{" "}
        {isEndPoint &&
        trip.journey_end_lat !== undefined &&
        trip.journey_end_lon !== undefined
          ? `${trip.journey_end_lat.toFixed(3)}, ${trip.journey_end_lon.toFixed(3)}`
          : `${trip.journey_start_lat.toFixed(3)}, ${trip.journey_start_lon.toFixed(3)}`}
      </p>
    </div>
  );
};

// Popup content for a cluster — aggregates come from the supercluster index;
// the operator-class breakdown is computed lazily, only when the popup opens
const ClusterPopup: React.FC<{
  cluster: ClusterView;
  indexed: IndexedTrips | null;
}> = ({ cluster, indexed }) => {
  const map = useMap();

  const avgDistance = cluster.count > 0 ? cluster.sumDistance / cluster.count : 0;

  const topOperatorClass = useMemo(() => {
    if (cluster.clusterId === null || !indexed) return null;
    const counts: Record<string, number> = {};
    for (const leaf of indexed.index.getLeaves(cluster.clusterId, 100)) {
      const trip = indexed.trips[leaf.properties.tripIndex];
      if (trip?.operator_class) {
        counts[trip.operator_class] = (counts[trip.operator_class] || 0) + 1;
      }
    }
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }, [cluster.clusterId, indexed]);

  const handleZoomClick = () => {
    const targetZoom =
      cluster.clusterId !== null && indexed
        ? Math.min(
            indexed.index.getClusterExpansionZoom(cluster.clusterId),
            MIN_ZOOM_FOR_TRIPS
          )
        : MIN_ZOOM_FOR_TRIPS;
    map.setView([cluster.lat, cluster.lon], targetZoom);
  };

  return (
    <div className="popup-content">
      <h3 className="text-lg font-bold mb-2">Zone de covoiturage</h3>
      <div className="space-y-1">
        <p>
          <strong>Nombre de trajets:</strong> {formatNumber(cluster.count)}
        </p>
        {avgDistance > 0 && (
          <p>
            <strong>Distance moyenne:</strong> {formatDistance(avgDistance)}
          </p>
        )}
        {topOperatorClass && (
          <p>
            <strong>Classe d'opérateur principale:</strong> {topOperatorClass}
          </p>
        )}
        <button
          onClick={handleZoomClick}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
        >
          Zoomer pour voir les trajets
        </button>
      </div>
    </div>
  );
};

interface MapContentProps {
  visibleTrips: Trip[];
  visibleClusters: ClusterView[];
  showIndividualTrips: boolean;
  selectedTrip: Trip | null;
  onTripClick: (trip: Trip) => void;
  onOpenPopup: (popup: OpenPopup) => void;
}

// Memoized map content component — markers carry no mounted popups
const MapContent: React.FC<MapContentProps> = React.memo(
  ({
    visibleTrips,
    visibleClusters,
    showIndividualTrips,
    selectedTrip,
    onTripClick,
    onOpenPopup,
  }) => {
    return (
      <>
        {/* Trip clusters when zoomed out */}
        {!showIndividualTrips &&
          visibleClusters.map((cluster) => {
            // Size based on number of trips in cluster (with a minimum)
            const radius = Math.max(
              5,
              Math.min(20, Math.log(cluster.count) * 3)
            );

            // Color from blue to red based on count
            const intensity = Math.min(255, Math.log(cluster.count) * 20);
            const clusterColor = `rgb(${intensity}, 0, ${255 - intensity})`;

            const clusterOptions: PathOptions = {
              fillColor: clusterColor,
              color: "#fff",
              weight: 1,
              opacity: 0.8,
              fillOpacity: 0.6,
            };

            return (
              <CircleMarker
                key={cluster.key}
                center={[cluster.lat, cluster.lon]}
                radius={radius}
                pathOptions={clusterOptions}
                eventHandlers={{
                  click: () => {
                    onOpenPopup({
                      kind: "cluster",
                      cluster,
                      position: [cluster.lat, cluster.lon],
                    });
                  },
                }}
              />
            );
          })}

        {/* Individual trips when zoomed in */}
        {showIndividualTrips &&
          visibleTrips.map((trip) => {
            const isSelected =
              selectedTrip !== null &&
              selectedTrip.journey_id === trip.journey_id;

            const startMarkerOptions: PathOptions = {
              fillColor: isSelected ? "#30c0ff" : "#3388ff",
              color: "#fff",
              weight: 1,
              opacity: 1,
              fillOpacity: isSelected ? 1 : 0.8,
            };

            const endMarkerOptions: PathOptions = {
              fillColor: isSelected ? "#ff30c0" : "#ff3388",
              color: "#fff",
              weight: 1,
              opacity: 1,
              fillOpacity: isSelected ? 1 : 0.8,
            };

            const lineOptions: PathOptions = {
              color: isSelected ? "#30c0ff" : "#3388ff",
              weight: isSelected ? 4 : 2,
              opacity: isSelected ? 0.8 : 0.5,
            };

            const hasEnd =
              trip.journey_end_lat !== undefined &&
              trip.journey_end_lon !== undefined;

            return (
              <React.Fragment key={trip.journey_id}>
                <CircleMarker
                  center={[trip.journey_start_lat, trip.journey_start_lon]}
                  radius={isSelected ? 7 : 5}
                  pathOptions={startMarkerOptions}
                  eventHandlers={{
                    click: () => {
                      onTripClick(trip);
                      onOpenPopup({
                        kind: "trip",
                        trip,
                        isEndPoint: false,
                        position: [
                          trip.journey_start_lat,
                          trip.journey_start_lon,
                        ],
                      });
                    },
                  }}
                />

                {hasEnd && (
                  <>
                    <Polyline
                      positions={[
                        [trip.journey_start_lat, trip.journey_start_lon],
                        [trip.journey_end_lat!, trip.journey_end_lon!],
                      ]}
                      pathOptions={lineOptions}
                      eventHandlers={{
                        click: () => onTripClick(trip),
                      }}
                    />

                    <CircleMarker
                      center={[trip.journey_end_lat!, trip.journey_end_lon!]}
                      radius={isSelected ? 5 : 3}
                      pathOptions={endMarkerOptions}
                      eventHandlers={{
                        click: () => {
                          onTripClick(trip);
                          onOpenPopup({
                            kind: "trip",
                            trip,
                            isEndPoint: true,
                            position: [
                              trip.journey_end_lat!,
                              trip.journey_end_lon!,
                            ],
                          });
                        },
                      }}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}
      </>
    );
  }
);

const Map: React.FC<MapProps> = ({ onStatsChange }) => {
  const {
    tripData,
    progress,
    selectedTrip,
    dataTitle,
    availableMonths,
    selectTrip,
    clearSelectedTrip,
    selectMonth,
  } = useTripData();

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  const [openPopup, setOpenPopup] = useState<OpenPopup | null>(null);

  const indexed = useTripIndex(tripData);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setCurrentBounds(bounds);
  }, []);

  const showIndividualTrips = currentZoom >= MIN_ZOOM_FOR_TRIPS;

  // One spatial-index query per view change — no full-array scans.
  // Trips resolve against the index's own snapshot (indexed.trips), which can
  // lag behind tripData while a throttled rebuild is pending.
  const { visibleTrips, visibleClusters, totalTripsInView } = useMemo(() => {
    if (!indexed || !currentBounds) {
      return {
        visibleTrips: [] as Trip[],
        visibleClusters: [] as ClusterView[],
        totalTripsInView: 0,
      };
    }
    const { index, trips: indexedTrips } = indexed;

    const bbox: [number, number, number, number] = [
      currentBounds.getWest(),
      currentBounds.getSouth(),
      currentBounds.getEast(),
      currentBounds.getNorth(),
    ];
    const features = index.getClusters(bbox, Math.round(currentZoom));

    if (currentZoom >= MIN_ZOOM_FOR_TRIPS) {
      // Above the cluster maxZoom every feature is an individual point
      const trips: Trip[] = [];
      for (const feature of features) {
        if (!isClusterFeature(feature)) {
          const trip = indexedTrips[feature.properties.tripIndex];
          if (trip) trips.push(trip);
        }
      }
      return {
        visibleTrips: trips.slice(0, MAX_VISIBLE_TRIPS),
        visibleClusters: [] as ClusterView[],
        totalTripsInView: trips.length,
      };
    }

    const clusters: ClusterView[] = [];
    for (const feature of features) {
      const [lon, lat] = feature.geometry.coordinates;
      if (isClusterFeature(feature)) {
        clusters.push({
          key: `c${feature.id}`,
          clusterId: feature.id as number,
          lat,
          lon,
          count: feature.properties.point_count,
          sumDistance: feature.properties.sumDistance,
        });
        continue;
      }
      const trip = indexedTrips[feature.properties.tripIndex];
      if (!trip) continue;
      clusters.push({
        key: `p${feature.properties.tripIndex}`,
        clusterId: null,
        lat,
        lon,
        count: 1,
        sumDistance: trip.journey_distance,
      });
    }

    return {
      visibleTrips: [] as Trip[],
      visibleClusters: clusters,
      totalTripsInView: clusters.reduce((sum, c) => sum + c.count, 0),
    };
  }, [indexed, currentBounds, currentZoom]);

  // Update parent component with stats about the current map view
  useEffect(() => {
    onStatsChange({
      zoom: currentZoom,
      tripCount: visibleTrips.length,
      clusterCount: visibleClusters.length,
      totalTripsInView,
    });
  }, [
    currentZoom,
    visibleTrips.length,
    visibleClusters.length,
    totalTripsInView,
    onStatsChange,
  ]);

  // Toggle trip selection
  const handleTripClick = useCallback(
    (trip: Trip) => {
      if (selectedTrip && selectedTrip.journey_id === trip.journey_id) {
        clearSelectedTrip();
      } else {
        selectTrip(trip);
      }
    },
    [selectedTrip, selectTrip, clearSelectedTrip]
  );

  const handleOpenPopup = useCallback((popup: OpenPopup) => {
    setOpenPopup(popup);
  }, []);

  return (
    <div className="map-wrapper relative w-full h-screen">
      {/* Non-blocking streaming progress pill — the map stays interactive */}
      {!progress.done && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1500] bg-white/90 rounded-full shadow-md px-4 py-1.5 text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          {progress.rows === 0
            ? "Chargement des données…"
            : `${formatNumber(progress.rows)} trajets chargés…`}
        </div>
      )}

      {/* Source Data Banner with month navigation */}
      <div className="fixed top-0 left-0 right-0 bg-green-600 text-white p-2 shadow-xl z-[1000] font-medium flex items-center justify-center gap-2 flex-wrap">
        <span>Trajets réalisés en covoiturage</span>
        {availableMonths.length > 0 && dataTitle ? (
          <select
            value={dataTitle}
            onChange={(e) => selectMonth(e.target.value)}
            disabled={!progress.done}
            aria-label="Mois des données"
            className="bg-green-700 text-white text-sm rounded border border-green-400 px-2 py-1 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {availableMonths.map((month) => (
              <option key={month.id} value={month.title}>
                {formatMonthFromTitle(month.title) ?? month.title}
              </option>
            ))}
          </select>
        ) : (
          dataTitle && <span>— {formatMonthFromTitle(dataTitle)}</span>
        )}
        <a
          href="https://www.data.gouv.fr/fr/datasets/trajets-realises-en-covoiturage-registre-de-preuve-de-covoiturage/#/resources"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-bold hover:text-green-200 ml-1"
        >
          Source
        </a>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        preferCanvas={true}
        fadeAnimation={false}
        className="absolute inset-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
        />

        <MapContent
          visibleTrips={visibleTrips}
          visibleClusters={visibleClusters}
          showIndividualTrips={showIndividualTrips}
          selectedTrip={selectedTrip}
          onTripClick={handleTripClick}
          onOpenPopup={handleOpenPopup}
        />

        {openPopup && (
          <Popup
            position={openPopup.position}
            eventHandlers={{ remove: () => setOpenPopup(null) }}
          >
            {openPopup.kind === "trip" ? (
              <TripPopup
                trip={openPopup.trip}
                isEndPoint={openPopup.isEndPoint}
              />
            ) : (
              <ClusterPopup cluster={openPopup.cluster} indexed={indexed} />
            )}
          </Popup>
        )}
      </MapContainer>

      {/* Stats display */}
      <div className="absolute bottom-5 right-5 bg-white/80 rounded p-2 text-sm z-10">
        <div>Zoom: {currentZoom}</div>
        <div>
          {showIndividualTrips
            ? `Trajets visibles: ${formatNumber(visibleTrips.length)}` +
              (totalTripsInView > visibleTrips.length
                ? ` / ${formatNumber(totalTripsInView)}`
                : "")
            : `Zones visibles: ${formatNumber(visibleClusters.length)}`}
        </div>
      </div>

      {/* Marketing Banner */}
      <div className="fixed bottom-8 left-10 right-10 bg-blue-600 text-white p-4 text-center shadow-xl z-[1000] font-medium rounded-lg mx-auto flex items-center justify-center">
        <img src={teamWheelsLogo} alt="TeamWheels Logo" className="h-10 mr-3" />
        TeamWheels, la solution la plus fluide et originale pour mettre en place
        le covoiturage dans votre entreprise, pour plus d'infos{" "}
        <a
          href="https://www.teamwheelsapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-bold hover:text-blue-200 ml-1"
        >
          cliquez ici
        </a>
      </div>
    </div>
  );
};

export default Map;

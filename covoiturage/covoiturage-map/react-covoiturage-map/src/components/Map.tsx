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
  MapProps,
  MapUpdaterProps,
  MapEventHandlerProps,
  TripPopupProps,
  ClusterPopupProps,
  MapContentProps,
  Trip,
  Cluster,
  Bounds,
} from "../types";
import teamWheelsLogo from "../assets/images/logo.png";

// Center of France for initial map view
const DEFAULT_CENTER: [number, number] = [46.603354, 1.888334];
const DEFAULT_ZOOM = 6;
const MAX_TRIPS_TO_DISPLAY = 600000;

// Zoom thresholds for different detail levels
const CLUSTER_GRID_SIZE_ZOOM: Record<number, number> = {
  5: 1.5, // Very large grid at low zoom
  6: 1, // Large grid
  7: 0.5, // Medium grid
  8: 0.25, // Smaller grid
  9: 0.1, // Very small grid
  10: 0.05, // Very small grid
  11: 0.025, // Very small grid
  12: 0.01, // Very small grid
  13: 0.005, // Very small grid
  14: 0.0025, // Very small grid
};
const MIN_ZOOM_FOR_TRIPS = 15; // Show individual trips only at zoom level 10+

// Helper component to update map view when bounds change and track zoom level
const MapUpdater: React.FC<MapUpdaterProps> = ({ bounds, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    console.log("MapUpdater useEffect bounds", bounds);
    if (bounds && bounds.length > 1) {
      map.fitBounds(bounds as [number, number][]);
    }
  }, [bounds, map]);

  useEffect(() => {
    console.log("MapUpdater useEffect");
    // Track zoom level changes
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };

    map.on("zoomend", handleZoomEnd);

    // Initialize with current zoom
    onZoomChange(map.getZoom());

    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, onZoomChange]);

  return null;
};

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
    load: () => {
      onBoundsChange(map.getBounds());
      onZoomChange(map.getZoom());
    },
  });

  return null;
};

// Component to create a popup content
const TripPopup: React.FC<TripPopupProps> = ({ trip, isEndPoint }) => {
  const { formatDate, formatDistance } = useTripData();

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
      {trip.operator && trip.operator !== "N/A" && (
        <p>
          <strong>Opérateur:</strong> {trip.operator}
        </p>
      )}
      {trip.passenger_count && trip.passenger_count > 0 && (
        <p>
          <strong>Passagers:</strong> {trip.passenger_count}
        </p>
      )}
      {/* Display GPS coordinates */}
      {isEndPoint &&
      trip.journey_end_lat !== undefined &&
      trip.journey_end_lon !== undefined ? (
        <p>
          <strong>Coordonnées GPS:</strong> {trip.journey_end_lat.toFixed(6)},{" "}
          {trip.journey_end_lon.toFixed(6)}
        </p>
      ) : !isEndPoint &&
        trip.journey_start_lat !== undefined &&
        trip.journey_start_lon !== undefined ? (
        <p>
          <strong>Coordonnées GPS:</strong> {trip.journey_start_lat.toFixed(6)},{" "}
          {trip.journey_start_lon.toFixed(6)}
        </p>
      ) : null}
    </div>
  );
};

// Component to create a cluster popup content
const ClusterPopup: React.FC<ClusterPopupProps> = ({ cluster }) => {
  const { formatDistance } = useTripData();
  const map = useMap();

  // Calculate average distance for trips in this cluster
  const avgDistance =
    cluster.trips.length > 0
      ? cluster.trips.reduce(
          (sum, trip) => sum + (trip.journey_distance || 0),
          0
        ) / cluster.trips.length
      : 0;

  // Calculate most common operator
  const operatorCounts: Record<string, number> = {};
  cluster.trips.forEach((trip) => {
    const operator = trip.operator || "N/A";
    operatorCounts[operator] = (operatorCounts[operator] || 0) + 1;
  });

  let topOperator = "N/A";
  let maxCount = 0;

  Object.entries(operatorCounts).forEach(([operator, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topOperator = operator;
    }
  });

  // Handle zoom in button
  const handleZoomClick = () => {
    map.setView([cluster.lat, cluster.lon], MIN_ZOOM_FOR_TRIPS);
  };

  return (
    <div className="popup-content">
      <h3 className="text-lg font-bold mb-2">Zone de covoiturage</h3>
      <div className="space-y-1">
        <p>
          <strong>Nombre de trajets:</strong> {cluster.count}
        </p>
        {avgDistance > 0 && (
          <p>
            <strong>Distance moyenne:</strong> {formatDistance(avgDistance)}
          </p>
        )}
        {topOperator !== "N/A" && (
          <p>
            <strong>Opérateur principal:</strong> {topOperator}
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

// Memoized map content component
const MapContent: React.FC<MapContentProps> = React.memo(
  ({
    visibleTrips,
    visibleClusters,
    showIndividualTrips,
    handleTripClick,
    selectedTrip,
  }) => {
    return (
      <>
        {/* Display trip clusters when zoomed out */}
        {!showIndividualTrips &&
          visibleClusters.map((cluster, idx) => {
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
                key={`cluster-${idx}`}
                center={[cluster.lat, cluster.lon]}
                radius={radius}
                pathOptions={clusterOptions}
                eventHandlers={{
                  click: (e) => {
                    // Stop propagation to prevent map click
                    e.originalEvent.stopPropagation();
                  },
                }}
              >
                <Popup>
                  <ClusterPopup cluster={cluster} />
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Display individual trips only when zoomed in */}
        {showIndividualTrips &&
          visibleTrips.map((trip) => {
            // Check if this trip is the selected one
            const isSelected =
              selectedTrip && selectedTrip.journey_id === trip.journey_id;

            // Styles for the markers and lines
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

            return (
              <React.Fragment key={trip.journey_id || Math.random().toString()}>
                {/* Start point marker */}
                <CircleMarker
                  center={[trip.journey_start_lat, trip.journey_start_lon]}
                  radius={isSelected ? 7 : 5}
                  pathOptions={startMarkerOptions}
                  eventHandlers={{
                    click: () => handleTripClick(trip),
                  }}
                >
                  <Popup>
                    <TripPopup trip={trip} isEndPoint={false} />
                  </Popup>
                </CircleMarker>

                {/* Trip line and end marker if end coordinates exist */}
                {trip.journey_end_lat &&
                  trip.journey_end_lon &&
                  !isNaN(trip.journey_end_lat) &&
                  !isNaN(trip.journey_end_lon) && (
                    <>
                      <Polyline
                        positions={[
                          [trip.journey_start_lat, trip.journey_start_lon],
                          [trip.journey_end_lat, trip.journey_end_lon],
                        ]}
                        pathOptions={lineOptions}
                        eventHandlers={{
                          click: () => handleTripClick(trip),
                        }}
                      />

                      <CircleMarker
                        center={[trip.journey_end_lat, trip.journey_end_lon]}
                        radius={isSelected ? 5 : 3}
                        pathOptions={endMarkerOptions}
                        eventHandlers={{
                          click: () => handleTripClick(trip),
                        }}
                      >
                        <Popup>
                          <TripPopup trip={trip} isEndPoint={true} />
                        </Popup>
                      </CircleMarker>
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
    selectedTrip,
    selectTrip,
    clearSelectedTrip,
    getTripsInBounds,
    getTripClusters,
  } = useTripData();

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  const [visibleTrips, setVisibleTrips] = useState<Trip[]>([]);
  const [visibleClusters, setVisibleClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Calculate bounds for initial map view
  const initialBounds = useMemo(() => {
    if (!tripData || !Array.isArray(tripData) || tripData.length === 0)
      return null;

    const points: [number, number][] = [];
    // Only use a sample of trips for initial bounds to improve performance
    const sampleData = tripData.slice(0, 1000);

    sampleData.forEach((trip) => {
      if (trip.journey_start_lat && trip.journey_start_lon) {
        points.push([trip.journey_start_lat, trip.journey_start_lon]);
      }
      if (trip.journey_end_lat && trip.journey_end_lon) {
        points.push([trip.journey_end_lat, trip.journey_end_lon]);
      }
    });

    return points.length > 0 ? points : null;
  }, [tripData]);

  // Handle loading state
  useEffect(() => {
    if (tripData && tripData.length > 0 && initialBounds) {
      // Set a slight delay to allow map to render
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tripData, initialBounds]);

  // Handle zoom level change
  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  // Handle bounds change
  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setCurrentBounds(bounds);
  }, []);

  // Update visible trips and clusters when bounds or zoom changes
  useEffect(() => {
    if (!currentBounds) return;

    const boundsArray: Bounds = [
      [currentBounds.getSouth(), currentBounds.getWest()],
      [currentBounds.getNorth(), currentBounds.getEast()],
    ];

    try {
      if (currentZoom >= MIN_ZOOM_FOR_TRIPS) {
        const tripsInView = getTripsInBounds(boundsArray);
        setVisibleTrips(tripsInView);
        setVisibleClusters([]);
      } else {
        const zoomLevels = Object.keys(CLUSTER_GRID_SIZE_ZOOM).map(Number);
        const nearestZoomLevel = zoomLevels.reduce((prev, curr) =>
          Math.abs(curr - currentZoom) < Math.abs(prev - currentZoom)
            ? curr
            : prev
        );
        const gridSize = CLUSTER_GRID_SIZE_ZOOM[nearestZoomLevel] || 1;

        const clusters = getTripClusters(boundsArray, gridSize);
        setVisibleClusters(clusters);
        setVisibleTrips([]);
      }
    } catch (error) {
      console.error("Error updating map data:", error);
    }
  }, [currentBounds, currentZoom, getTripsInBounds, getTripClusters]);

  // Update parent component with stats about the current map view
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({
        zoom: currentZoom,
        tripCount: visibleTrips.length,
        clusterCount: visibleClusters.length,
        totalTripsInView:
          currentZoom >= MIN_ZOOM_FOR_TRIPS
            ? visibleTrips.length
            : visibleClusters.reduce((sum, cluster) => sum + cluster.count, 0),
      });
    }
  }, [currentZoom, visibleTrips.length, visibleClusters.length, onStatsChange]);

  // Should we show individual trips based on zoom level?
  const showIndividualTrips = currentZoom >= MIN_ZOOM_FOR_TRIPS;

  // Handle trip line click
  const handleTripClick = useCallback(
    (trip: Trip) => {
      // If the trip is already selected, clear the selection
      if (selectedTrip && selectedTrip.journey_id === trip.journey_id) {
        clearSelectedTrip();
      } else {
        // Otherwise, select the trip
        selectTrip(trip);
      }
    },
    [selectedTrip, selectTrip, clearSelectedTrip]
  );

  return (
    <div className="map-wrapper relative w-full h-screen">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/70 z-[2000] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl font-semibold">
            Chargement des données...
          </p>
        </div>
      )}

      {/* Source Data Banner */}
      <div className="fixed top-0 left-0 right-0 bg-green-600 text-white p-2 text-center shadow-xl z-[1000] font-medium">
        Trajets réalisés en covoiturage au mois de février 2025{" "}
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
        className="absolute inset-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {initialBounds && (
          <MapUpdater bounds={initialBounds} onZoomChange={handleZoomChange} />
        )}
        <MapEventHandler
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
        />

        <MapContent
          visibleTrips={visibleTrips}
          visibleClusters={visibleClusters}
          showIndividualTrips={showIndividualTrips}
          handleTripClick={handleTripClick}
          selectedTrip={selectedTrip}
        />
      </MapContainer>

      {/* Stats display */}
      <div className="absolute bottom-5 right-5 bg-white/80 rounded p-2 text-sm z-10">
        <div>Zoom: {currentZoom}</div>
        <div>
          {showIndividualTrips
            ? `Trajets visibles: ${visibleTrips.length}`
            : `Zones visibles: ${visibleClusters.length}`}
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

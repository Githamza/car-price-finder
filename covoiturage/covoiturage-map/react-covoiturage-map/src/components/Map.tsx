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
import { useTripIndex, isClusterFeature } from "../hooks/useTripIndex";
import {
  buildFlowModel,
  cellSizeForZoom,
  arcPoints,
  arrowPoints,
  Flow,
  FlowModel,
  FlowZone,
} from "../map/flows";
import {
  MIN_ZOOM_FOR_TRIPS,
  MAX_VISIBLE_TRIPS,
  MAX_VISIBLE_FLOWS,
} from "../config";
import {
  MapProps,
  MapEventHandlerProps,
  TripPopupProps,
  Trip,
} from "../types";
import teamWheelsLogo from "../assets/images/logo.png";

// Center of France for initial map view
const DEFAULT_CENTER: [number, number] = [46.603354, 1.888334];
const DEFAULT_ZOOM = 6;

const FLOW_COLOR = "#3b82f6";
const FLOW_IN_COLOR = "#ff3388"; // incoming flows when a zone is isolated

// A flow ready to render: endpoints resolved, arc + arrowhead sampled
interface FlowArc {
  flow: Flow;
  fromZone: FlowZone;
  toZone: FlowZone;
  positions: [number, number][][]; // [arc, arrowhead]
}

// The single controlled popup — content components mount only when open
type OpenPopup =
  | {
      kind: "trip";
      trip: Trip;
      isEndPoint: boolean;
      position: [number, number];
    }
  | { kind: "zone"; zone: FlowZone; position: [number, number] }
  | { kind: "flow"; arc: FlowArc; position: [number, number] };

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
    </div>
  );
};

// Popup content for a flow arc
const FlowPopup: React.FC<{ arc: FlowArc }> = ({ arc }) => {
  const { flow, fromZone, toZone } = arc;
  const avgDistance = flow.sumDistance / flow.count;

  return (
    <div className="popup-content">
      <h3 className="text-base font-bold mb-1">
        {fromZone.town ?? "Zone"} → {toZone.town ?? "Zone"}
      </h3>
      <p>
        <strong>Trajets:</strong> {formatNumber(flow.count)}
      </p>
      {avgDistance > 0 && (
        <p>
          <strong>Distance moyenne:</strong> {formatDistance(avgDistance)}
        </p>
      )}
    </div>
  );
};

// Popup content for a zone: activity summary + top destinations + isolation
const ZonePopup: React.FC<{
  zone: FlowZone;
  model: FlowModel | null;
  isolated: boolean;
  onToggleIsolate: () => void;
  onClose: () => void;
}> = ({ zone, model, isolated, onToggleIsolate, onClose }) => {
  const map = useMap();

  const topDestinations = useMemo(() => {
    if (!model) return [];
    // Merge by town name — adjacent grid cells can share the same town.
    // (Plain object because `Map` is shadowed by this component's name.)
    const byTown: Record<string, number> = {};
    for (const flow of model.flows) {
      if (flow.from !== zone.key) continue;
      const town = model.zones.get(flow.to)?.town ?? "Zone voisine";
      byTown[town] = (byTown[town] ?? 0) + flow.count;
    }
    return Object.entries(byTown)
      .map(([town, count]) => ({ town, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [model, zone.key]);

  return (
    <div className="popup-content">
      <h3 className="text-base font-bold mb-1">{zone.town ?? "Zone"}</h3>
      <div className="space-y-1">
        <p>
          <strong>Départs:</strong> {formatNumber(zone.startCount)} ·{" "}
          <strong>Arrivées:</strong> {formatNumber(zone.endCount)}
        </p>
        {zone.intraCount > 0 && (
          <p>
            <strong>Trajets internes:</strong> {formatNumber(zone.intraCount)}
          </p>
        )}
        {topDestinations.length > 0 && (
          <div>
            <strong>Top destinations:</strong>
            <ul className="list-disc ml-4">
              {topDestinations.map((d, i) => (
                <li key={i}>
                  {d.town} ({formatNumber(d.count)})
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onToggleIsolate}
            className={`${
              isolated ? "bg-gray-500 hover:bg-gray-700" : "bg-pink-600 hover:bg-pink-700"
            } text-white py-1 px-2 rounded text-xs`}
          >
            {isolated ? "Tout afficher" : "Isoler ses flux"}
          </button>
          <button
            onClick={() => {
              onClose();
              map.setView([zone.lat, zone.lon], map.getZoom() + 2);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
          >
            Zoomer
          </button>
        </div>
      </div>
    </div>
  );
};

interface MapContentProps {
  zones: FlowZone[];
  arcs: FlowArc[];
  isolatedZoneKey: string | null;
  visibleTrips: Trip[];
  showIndividualTrips: boolean;
  selectedTrip: Trip | null;
  onTripClick: (trip: Trip) => void;
  onOpenPopup: (popup: OpenPopup) => void;
}

// Memoized map content component — markers carry no mounted popups
const MapContent: React.FC<MapContentProps> = React.memo(
  ({
    zones,
    arcs,
    isolatedZoneKey,
    visibleTrips,
    showIndividualTrips,
    selectedTrip,
    onTripClick,
    onOpenPopup,
  }) => {
    return (
      <>
        {/* Flow arcs (zoomed out) */}
        {!showIndividualTrips &&
          arcs.map((arc) => {
            const { flow } = arc;
            const outgoing = flow.from === isolatedZoneKey;
            const incoming = flow.to === isolatedZoneKey;
            const dimmed =
              isolatedZoneKey !== null && !outgoing && !incoming;

            const weight = 1 + Math.min(6, Math.log2(flow.count));
            const options: PathOptions = {
              color: incoming ? FLOW_IN_COLOR : FLOW_COLOR,
              weight: dimmed ? 1 : weight,
              opacity: dimmed
                ? 0.06
                : isolatedZoneKey
                  ? 0.85
                  : flow.count === 1
                    ? 0.3
                    : 0.55,
            };

            return (
              <Polyline
                key={flow.key}
                positions={arc.positions}
                pathOptions={options}
                eventHandlers={{
                  click: () => {
                    const mid =
                      arc.positions[0][Math.floor(arc.positions[0].length / 2)];
                    onOpenPopup({ kind: "flow", arc, position: mid });
                  },
                }}
              />
            );
          })}

        {/* Zone bubbles (zoomed out) */}
        {!showIndividualTrips &&
          zones.map((zone) => {
            const activity = zone.startCount + zone.endCount;
            const radius = Math.max(5, Math.min(20, Math.log(activity) * 2.6));
            const intensity = Math.min(255, Math.log(activity) * 18);
            const dimmed =
              isolatedZoneKey !== null && zone.key !== isolatedZoneKey;

            const options: PathOptions = {
              fillColor: `rgb(${intensity}, 0, ${255 - intensity})`,
              color: "#fff",
              weight: 1,
              opacity: dimmed ? 0.15 : 0.9,
              fillOpacity: dimmed ? 0.12 : 0.75,
            };

            return (
              <CircleMarker
                key={zone.key}
                center={[zone.lat, zone.lon]}
                radius={radius}
                pathOptions={options}
                eventHandlers={{
                  click: () => {
                    onOpenPopup({
                      kind: "zone",
                      zone,
                      position: [zone.lat, zone.lon],
                    });
                  },
                }}
              />
            );
          })}

        {/* Individual trips (street-level zoom) */}
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
  const [isolatedZoneKey, setIsolatedZoneKey] = useState<string | null>(null);

  const indexed = useTripIndex(tripData);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setCurrentBounds(bounds);
  }, []);

  const showIndividualTrips = currentZoom >= MIN_ZOOM_FOR_TRIPS;

  // Close popups that belong to the other view mode when crossing the
  // flow/individual-trips threshold
  useEffect(() => {
    setOpenPopup((current) => {
      if (!current) return current;
      const isTripPopup = current.kind === "trip";
      return isTripPopup === showIndividualTrips ? current : null;
    });
  }, [showIndividualTrips]);

  // Flow model: recomputed only when the data or the zoom bucket changes —
  // panning just filters it
  const zoomBucket = Math.min(
    MIN_ZOOM_FOR_TRIPS - 1,
    Math.max(4, Math.round(currentZoom))
  );
  const flowModel = useMemo(() => {
    if (tripData.length === 0 || showIndividualTrips) return null;
    return buildFlowModel(tripData, cellSizeForZoom(zoomBucket));
  }, [tripData, zoomBucket, showIndividualTrips]);

  // Visible zones + top flows for the current view
  const { visibleZones, visibleArcs, flowTripsInView } = useMemo(() => {
    if (!flowModel || !currentBounds) {
      return {
        visibleZones: [] as FlowZone[],
        visibleArcs: [] as FlowArc[],
        flowTripsInView: 0,
      };
    }

    // Pad the view so flows to just-off-screen zones stay visible
    const bounds = currentBounds.pad(0.5);
    const inView = (zone: FlowZone) => bounds.contains([zone.lat, zone.lon]);

    const visibleZones: FlowZone[] = [];
    let flowTripsInView = 0;
    for (const zone of flowModel.zones.values()) {
      if (inView(zone)) {
        visibleZones.push(zone);
        flowTripsInView += zone.startCount;
      }
    }

    const visibleArcs: FlowArc[] = [];
    for (const flow of flowModel.flows) {
      if (visibleArcs.length >= MAX_VISIBLE_FLOWS) break;
      const fromZone = flowModel.zones.get(flow.from);
      const toZone = flowModel.zones.get(flow.to);
      if (!fromZone || !toZone) continue;
      if (!inView(fromZone) && !inView(toZone)) continue;
      if (
        isolatedZoneKey !== null &&
        flow.from !== isolatedZoneKey &&
        flow.to !== isolatedZoneKey
      ) {
        continue; // isolation: skip unrelated flows entirely
      }
      const arc = arcPoints(
        [fromZone.lat, fromZone.lon],
        [toZone.lat, toZone.lon]
      );
      visibleArcs.push({
        flow,
        fromZone,
        toZone,
        positions: [arc, arrowPoints(arc)],
      });
    }

    return { visibleZones, visibleArcs, flowTripsInView };
  }, [flowModel, currentBounds, isolatedZoneKey]);

  // Individual trips: queried from BOTH endpoints, so a line stays visible
  // while either end is on screen
  const { visibleTrips, totalTripsInView } = useMemo(() => {
    if (!showIndividualTrips || !indexed || !currentBounds) {
      return { visibleTrips: [] as Trip[], totalTripsInView: 0 };
    }
    const { index, trips: indexedTrips } = indexed;

    const bbox: [number, number, number, number] = [
      currentBounds.getWest(),
      currentBounds.getSouth(),
      currentBounds.getEast(),
      currentBounds.getNorth(),
    ];
    const features = index.getClusters(bbox, Math.round(currentZoom));

    const seen = new Set<number>();
    const trips: Trip[] = [];
    for (const feature of features) {
      if (isClusterFeature(feature)) continue;
      const i = feature.properties.tripIndex;
      if (seen.has(i)) continue;
      seen.add(i);
      const trip = indexedTrips[i];
      if (trip) trips.push(trip);
    }
    return {
      visibleTrips: trips.slice(0, MAX_VISIBLE_TRIPS),
      totalTripsInView: trips.length,
    };
  }, [showIndividualTrips, indexed, currentBounds, currentZoom]);

  // Update parent component with stats about the current map view
  useEffect(() => {
    onStatsChange({
      zoom: currentZoom,
      zoneCount: visibleZones.length,
      flowCount: visibleArcs.length,
      tripCount: visibleTrips.length,
      totalTripsInView: showIndividualTrips
        ? totalTripsInView
        : flowTripsInView,
    });
  }, [
    currentZoom,
    visibleZones.length,
    visibleArcs.length,
    visibleTrips.length,
    totalTripsInView,
    flowTripsInView,
    showIndividualTrips,
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

  const toggleIsolation = useCallback((zoneKey: string) => {
    setIsolatedZoneKey((current) => (current === zoneKey ? null : zoneKey));
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

      {/* Isolation banner */}
      {isolatedZoneKey !== null && !showIndividualTrips && (
        <div className="absolute top-14 right-4 z-[1500] bg-pink-600 text-white rounded-full shadow-md px-4 py-1.5 text-sm font-medium flex items-center gap-2">
          Flux d'une zone isolés
          <button
            onClick={() => setIsolatedZoneKey(null)}
            className="font-bold hover:text-pink-200"
            aria-label="Afficher tous les flux"
          >
            ✕
          </button>
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
          zones={visibleZones}
          arcs={visibleArcs}
          isolatedZoneKey={isolatedZoneKey}
          visibleTrips={visibleTrips}
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
            ) : openPopup.kind === "flow" ? (
              <FlowPopup arc={openPopup.arc} />
            ) : (
              <ZonePopup
                zone={openPopup.zone}
                model={flowModel}
                isolated={isolatedZoneKey === openPopup.zone.key}
                onToggleIsolate={() => toggleIsolation(openPopup.zone.key)}
                onClose={() => setOpenPopup(null)}
              />
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
            : `Zones: ${formatNumber(visibleZones.length)} · Flux: ${formatNumber(visibleArcs.length)}`}
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

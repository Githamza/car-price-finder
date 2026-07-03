import { LatLngBounds } from "leaflet";

// Trip data structure
export interface Trip {
  journey_id: string;
  datetime: string;
  journey_start_lat: number;
  journey_start_lon: number;
  journey_start_town?: string;
  journey_end_lat?: number;
  journey_end_lon?: number;
  journey_end_town?: string;
  journey_distance: number;
  operator: string;
  passenger_count: number;
}

// Cluster data structure
export interface Cluster {
  count: number;
  lat: number;
  lon: number;
  trips: Trip[];
}

// Map bounds structure
export type Bounds = [
  [number, number], // Southwest [lat, lng]
  [number, number] // Northeast [lat, lng]
];

// Map stats structure
export interface MapStats {
  zoom: number;
  tripCount: number;
  clusterCount: number;
  totalTripsInView: number;
}

// Message structure
export interface Message {
  type: "success" | "error" | "warning" | "info";
  text: string;
}

// Stats structure
export interface Stats {
  totalTrips: number;
  totalDistance: number;
}

// Context type for TripDataContext
export interface TripDataContextType {
  tripData: Trip[];
  isLoading: boolean;
  message: Message | null;
  stats: Stats;
  selectedTrip: Trip | null;
  selectTrip: (trip: Trip) => void;
  clearSelectedTrip: () => void;
  fetchTripData: () => Promise<void>;
  formatNumber: (number: number) => string;
  formatDistance: (meters: number) => string;
  formatDate: (dateString: string) => string;
  getTripsInBounds: (bounds: Bounds) => Trip[];
  getTripClusters: (bounds: Bounds, gridSize?: number) => Cluster[];
}

// Props types for components
export interface MapProps {
  onStatsChange: (stats: MapStats) => void;
}

export interface InfoPanelProps {
  mapStats: MapStats | null;
}

export interface MapUpdaterProps {
  bounds: number[][];
  onZoomChange: (zoom: number) => void;
}

export interface MapEventHandlerProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
  onZoomChange: (zoom: number) => void;
}

export interface TripPopupProps {
  trip: Trip;
  isEndPoint: boolean;
}

export interface ClusterPopupProps {
  cluster: Cluster;
}

export interface MapContentProps {
  visibleTrips: Trip[];
  visibleClusters: Cluster[];
  showIndividualTrips: boolean;
  handleTripClick: (trip: Trip) => void;
  selectedTrip: Trip | null;
}

export interface MapLegendProps {
  showSelected?: boolean;
}

export interface MessageToastProps {
  type: string;
  text: string;
}

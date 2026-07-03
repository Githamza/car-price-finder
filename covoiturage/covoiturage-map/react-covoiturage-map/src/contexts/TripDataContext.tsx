import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  FC,
  ReactNode,
  useMemo,
  useRef,
  useEffect,
} from "react";
import Papa from "papaparse";
import {
  Trip,
  TripDataContextType,
  Bounds,
  Cluster,
  Message,
  Stats,
} from "../types";

// API URL for fetching trip data
const API_URL =
  "https://www.data.gouv.fr/fr/datasets/r/0a89f315-266b-497f-971b-ca40d1d79cf4";

// Sample data for use when API fails
const SAMPLE_DATA: Trip[] = [
  {
    journey_id: "sample1",
    datetime: "2023-05-15T08:30:00Z",
    journey_start_lat: 48.8566,
    journey_start_lon: 2.3522,
    journey_end_lat: 45.764,
    journey_end_lon: 4.8357,
    journey_distance: 450000, // 450 km in meters
    operator: "BlaBlacar",
    passenger_count: 3,
  },
  {
    journey_id: "sample2",
    datetime: "2023-05-15T09:15:00Z",
    journey_start_lat: 43.2965,
    journey_start_lon: 5.3698,
    journey_end_lat: 43.6043,
    journey_end_lon: 1.4437,
    journey_distance: 320000, // 320 km in meters
    operator: "Karos",
    passenger_count: 2,
  },
  {
    journey_id: "sample3",
    datetime: "2023-05-15T10:00:00Z",
    journey_start_lat: 47.2184,
    journey_start_lon: -1.5536,
    journey_end_lat: 44.8378,
    journey_end_lon: -0.5792,
    journey_distance: 280000, // 280 km in meters
    operator: "Klaxit",
    passenger_count: 4,
  },
];

// Create context with default value
const TripDataContext = createContext<TripDataContextType | undefined>(
  undefined
);

// Custom hook for using the TripData context
export const useTripData = (): TripDataContextType => {
  const context = useContext(TripDataContext);
  if (context === undefined) {
    throw new Error("useTripData must be used within a TripDataProvider");
  }
  return context;
};

interface TripDataProviderProps {
  children: ReactNode;
}

export const TripDataProvider: FC<TripDataProviderProps> = ({ children }) => {
  // Add counter for debugging re-renders
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    console.log(`TripDataProvider rendered ${renderCount.current} times`);
  }, []);

  const [tripData, setTripData] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalTrips: 0,
    totalDistance: 0,
  });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Use a ref to track if data has been fetched
  const dataFetched = useRef(false);

  // Function to select a trip
  const selectTrip = useCallback((trip: Trip): void => {
    setSelectedTrip(trip);
  }, []);

  // Function to clear selected trip
  const clearSelectedTrip = useCallback((): void => {
    setSelectedTrip(null);
  }, []);

  // Function to show a temporary message
  const showMessage = useCallback(
    (type: Message["type"], text: string, duration = 3000): void => {
      setMessage({ type, text });

      setTimeout(() => {
        setMessage(null);
      }, duration);
    },
    []
  );

  // Function to update statistics
  const updateStats = useCallback((data: Trip[]): void => {
    if (!data || data.length === 0) {
      setStats({
        totalTrips: 0,
        totalDistance: 0,
      });
      return;
    }

    let totalDistance = 0;
    data.forEach((trip) => {
      totalDistance += trip.journey_distance || 0;
    });

    setStats({
      totalTrips: data.length,
      totalDistance: totalDistance,
    });
  }, []);

  // Function to parse CSV data and map it to our expected format
  const parseCSVData = useCallback((csvData: string): Promise<Trip[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<Record<string, string>>) => {
          try {
            if (results.data && results.data.length > 0) {
              // Map CSV columns to our expected data structure
              const mappedData = results.data.map(
                (row: Record<string, string>) => {
                  // Try to identify the column names in the CSV
                  // We'll use various possible column names since CSV formats can vary
                  const startLat = parseFloat(
                    row.journey_start_lat ||
                      row.start_lat ||
                      row.origine_lat ||
                      row.depart_lat ||
                      row.lat_start ||
                      row.lat_origine
                  );

                  const startLon = parseFloat(
                    row.journey_start_lon ||
                      row.start_lon ||
                      row.origine_lon ||
                      row.depart_lon ||
                      row.lon_start ||
                      row.lon_origine
                  );

                  const endLat = parseFloat(
                    row.journey_end_lat ||
                      row.end_lat ||
                      row.destination_lat ||
                      row.arrivee_lat ||
                      row.lat_end ||
                      row.lat_destination
                  );

                  const endLon = parseFloat(
                    row.journey_end_lon ||
                      row.end_lon ||
                      row.destination_lon ||
                      row.arrivee_lon ||
                      row.lon_end ||
                      row.lon_destination
                  );

                  const distance = parseInt(
                    row.journey_distance ||
                      row.distance ||
                      row.trip_distance ||
                      row.distance_m ||
                      row.distance_metres ||
                      "0"
                  );

                  return {
                    journey_id:
                      row.journey_id ||
                      row.trip_id ||
                      row.id ||
                      `trip-${Math.random().toString(36).substring(2, 10)}`,
                    datetime:
                      row.datetime ||
                      row.date ||
                      row.trip_date ||
                      row.journey_date ||
                      new Date().toISOString(),
                    journey_start_lat: startLat,
                    journey_start_lon: startLon,
                    journey_end_lat: endLat,
                    journey_end_lon: endLon,
                    journey_distance: distance,
                    operator:
                      row.operator || row.operateur || row.company || "N/A",
                    passenger_count: parseInt(
                      row.passenger_count ||
                        row.passengers ||
                        row.nb_passengers ||
                        "1"
                    ),
                  };
                }
              );

              // Filter out entries with invalid coordinates
              const validData = mappedData.filter(
                (trip: Trip) =>
                  trip.journey_start_lat &&
                  trip.journey_start_lon &&
                  !isNaN(trip.journey_start_lat) &&
                  !isNaN(trip.journey_start_lon)
              );

              resolve(validData);
            } else {
              reject(new Error("Empty or invalid CSV data"));
            }
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  }, []);

  // Function to fetch trip data from API
  const fetchTripData = useCallback(async (): Promise<void> => {
    // Prevent multiple fetch operations and only fetch once
    if (isLoading || dataFetched.current) {
      console.log("Skipping data fetch - already loading or fetched");
      return;
    }

    console.log("Starting data fetch");
    setIsLoading(true);
    clearSelectedTrip(); // Clear selected trip when fetching new data

    try {
      console.log("Loading data from API...");
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Get CSV text from response
      const csvText = await response.text();
      console.log("CSV data received, parsing...");

      // Parse CSV data
      const parsedData = await parseCSVData(csvText);
      console.log(`Data parsed: ${parsedData.length} trips`);

      // Check if we have valid data
      if (parsedData.length > 0) {
        setTripData(parsedData);
        updateStats(parsedData);
        showMessage(
          "success",
          `${parsedData.length} trips loaded successfully`
        );
        // Mark as fetched to prevent multiple fetches
        dataFetched.current = true;
      } else {
        throw new Error("No valid trips found in the data");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      showMessage(
        "error",
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );

      // Use sample data in case of error
      setTripData(SAMPLE_DATA);
      updateStats(SAMPLE_DATA);
      showMessage("warning", "Using sample data", 5000);
      // Mark as fetched even when using sample data
      dataFetched.current = true;
    } finally {
      setIsLoading(false);
    }
  }, [clearSelectedTrip, parseCSVData, showMessage, updateStats]);

  // Function to get trips within a bounding box - useful for map tiling
  const getTripsInBounds = useCallback(
    (bounds: Bounds): Trip[] => {
      if (!tripData || !Array.isArray(tripData) || !bounds) return [];

      const [southWest, northEast] = bounds;
      const [minLat, minLng] = southWest;
      const [maxLat, maxLng] = northEast;

      return tripData.filter(
        (trip) =>
          trip.journey_start_lat >= minLat &&
          trip.journey_start_lat <= maxLat &&
          trip.journey_start_lon >= minLng &&
          trip.journey_start_lon <= maxLng
      );
    },
    [tripData]
  );

  // Function to get trip clusters within a bounding box and grid size
  const getTripClusters = useCallback(
    (bounds: Bounds, gridSize: number = 1): Cluster[] => {
      if (!tripData || !Array.isArray(tripData) || !bounds) return [];

      const [southWest, northEast] = bounds;
      const [minLat, minLng] = southWest;
      const [maxLat, maxLng] = northEast;

      // Filter trips to those within bounds
      const tripsInBounds = tripData.filter(
        (trip) =>
          trip.journey_start_lat >= minLat &&
          trip.journey_start_lat <= maxLat &&
          trip.journey_start_lon >= minLng &&
          trip.journey_start_lon <= maxLng
      );

      // Create clusters
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
    },
    [tripData]
  );

  // Format number as a French locale string
  const formatNumber = useCallback((number: number): string => {
    return number.toLocaleString("fr-FR");
  }, []);

  // Format distance in km
  const formatDistance = useCallback((meters: number): string => {
    const kilometers = meters / 1000;
    return `${kilometers.toLocaleString("fr-FR", {
      maximumFractionDigits: 0,
    })} km`;
  }, []);

  // Format a date string
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return "Invalid date";
    }
  }, []);

  // Use effect to fetch data only once on mount
  useEffect(() => {
    // Only fetch data if we haven't fetched it yet
    if (!dataFetched.current) {
      console.log("Initial data fetch");
      fetchTripData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove fetchTripData from dependencies to prevent infinite loop

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      tripData,
      isLoading,
      message,
      stats,
      selectedTrip,
      selectTrip,
      clearSelectedTrip,
      fetchTripData,
      formatNumber,
      formatDistance,
      formatDate,
      getTripsInBounds,
      getTripClusters,
    }),
    [
      tripData,
      isLoading,
      message,
      stats,
      selectedTrip,
      selectTrip,
      clearSelectedTrip,
      fetchTripData,
      formatNumber,
      formatDistance,
      formatDate,
      getTripsInBounds,
      getTripClusters,
    ]
  );

  return (
    <TripDataContext.Provider value={contextValue}>
      {children}
    </TripDataContext.Provider>
  );
};

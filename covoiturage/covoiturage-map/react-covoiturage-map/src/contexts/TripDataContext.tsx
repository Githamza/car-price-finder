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
import { Trip, TripDataContextType, Message, Stats } from "../types";
import { CSV_URL } from "../config";
import { parseTripsCsv } from "../data/parseTrips";
import { SAMPLE_TRIPS } from "../data/sampleTrips";

const TripDataContext = createContext<TripDataContextType | undefined>(
  undefined
);

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
  const [tripData, setTripData] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalTrips: 0,
    totalDistance: 0,
  });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectTrip = useCallback((trip: Trip): void => {
    setSelectedTrip(trip);
  }, []);

  const clearSelectedTrip = useCallback((): void => {
    setSelectedTrip(null);
  }, []);

  const showMessage = useCallback(
    (type: Message["type"], text: string, duration = 3000): void => {
      setMessage({ type, text });

      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => {
        setMessage(null);
      }, duration);
    },
    []
  );

  const applyTrips = useCallback((trips: Trip[]): void => {
    setTripData(trips);
    setStats({
      totalTrips: trips.length,
      totalDistance: trips.reduce((sum, t) => sum + t.journey_distance, 0),
    });
  }, []);

  const load = useCallback(
    async (signal: AbortSignal): Promise<void> => {
      setIsLoading(true);
      clearSelectedTrip();

      try {
        const response = await fetch(CSV_URL, { signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const csvText = await response.text();
        const trips = parseTripsCsv(csvText);
        if (trips.length === 0) {
          throw new Error("Aucun trajet valide dans les données");
        }

        applyTrips(trips);
        showMessage("success", `${trips.length} trajets chargés`);
      } catch (error) {
        if (signal.aborted) return;

        showMessage(
          "error",
          `Erreur: ${error instanceof Error ? error.message : "inconnue"}`
        );
        applyTrips(SAMPLE_TRIPS);
        showMessage("warning", "Données d'exemple affichées", 5000);
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    },
    [applyTrips, clearSelectedTrip, showMessage]
  );

  const fetchTripData = useCallback(async (): Promise<void> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    await load(controller.signal);
  }, [load]);

  useEffect(() => {
    fetchTripData();
    return () => controllerRef.current?.abort();
  }, [fetchTripData]);

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
    ]
  );

  return (
    <TripDataContext.Provider value={contextValue}>
      {children}
    </TripDataContext.Provider>
  );
};

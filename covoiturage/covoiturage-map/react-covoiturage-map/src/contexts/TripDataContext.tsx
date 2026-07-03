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
import {
  Trip,
  TripDataContextType,
  Message,
  Stats,
  LoadProgress,
} from "../types";
import { CSV_URL, MAX_TRIPS, RESOURCE_ID } from "../config";
import { streamTrips } from "../data/streamTrips";
import { fetchResourceMeta } from "../data/resourceMeta";
import {
  isCacheValid,
  readCachedTrips,
  writeCachedTrips,
} from "../data/tripCache";
import { SAMPLE_TRIPS } from "../data/sampleTrips";
import { formatNumber } from "../utils/format";

// How often streamed trips are flushed from the buffer into React state
const FLUSH_INTERVAL_MS = 400;

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
  const [progress, setProgress] = useState<LoadProgress>({
    rows: 0,
    done: false,
  });
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
    async (signal: AbortSignal, forceRefresh: boolean): Promise<void> => {
      setIsLoading(true);
      setProgress({ rows: 0, done: false });
      clearSelectedTrip();

      try {
        const remote = await fetchResourceMeta(signal);

        if (!forceRefresh) {
          const cached = await readCachedTrips();
          if (
            cached &&
            isCacheValid(cached.meta, remote, RESOURCE_ID, MAX_TRIPS, Date.now())
          ) {
            applyTrips(cached.trips);
            setProgress({ rows: cached.trips.length, done: true });
            showMessage(
              "success",
              `${formatNumber(cached.trips.length)} trajets chargés (cache)`
            );
            return;
          }
        }

        const buffer: Trip[] = [];
        let lastFlush = 0;

        const streamOnce = () =>
          streamTrips(remote?.url ?? CSV_URL, {
            maxRows: MAX_TRIPS,
            signal,
            onBatch: (trips, totalSoFar) => {
              for (const trip of trips) buffer.push(trip);
              const now = performance.now();
              if (now - lastFlush >= FLUSH_INTERVAL_MS) {
                lastFlush = now;
                applyTrips(buffer.slice());
                setProgress({ rows: totalSoFar, done: false });
              }
            },
          });

        let total: number;
        try {
          total = await streamOnce();
        } catch (error) {
          // data.gouv.fr 503s intermittently — one retry after a short pause
          if (signal.aborted || buffer.length > 0) throw error;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          total = await streamOnce();
        }

        if (total === 0) {
          throw new Error("Aucun trajet valide dans les données");
        }

        applyTrips(buffer.slice());
        setProgress({ rows: total, done: true });
        showMessage("success", `${formatNumber(total)} trajets chargés`);

        await writeCachedTrips(buffer, {
          resourceId: RESOURCE_ID,
          checksum: remote?.checksum ?? null,
          rowCap: MAX_TRIPS,
          tripCount: total,
          storedAt: Date.now(),
        });
      } catch (error) {
        if (signal.aborted) return;

        showMessage(
          "error",
          `Erreur: ${error instanceof Error ? error.message : "inconnue"}`
        );
        applyTrips(SAMPLE_TRIPS);
        setProgress({ rows: SAMPLE_TRIPS.length, done: true });
        showMessage("warning", "Données d'exemple affichées", 5000);
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    },
    [applyTrips, clearSelectedTrip, showMessage]
  );

  // Exposed refresh: bypasses the cache and re-streams from the network
  const fetchTripData = useCallback(async (): Promise<void> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    await load(controller.signal, true);
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    load(controller.signal, false);
    return () => controller.abort();
  }, [load]);

  const contextValue = useMemo(
    () => ({
      tripData,
      isLoading,
      progress,
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
      progress,
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

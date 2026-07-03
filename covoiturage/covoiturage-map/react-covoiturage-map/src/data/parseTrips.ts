import Papa from "papaparse";
import { Trip } from "../types";

// The RPC CSV is semicolon-delimited with quoted fields.
export const CSV_DELIMITER = ";";

/**
 * Maps one parsed CSV row to a Trip using the dataset's real column names
 * (journey_start_datetime, passenger_seats, operator_class, ...).
 * Returns null for rows without valid start coordinates.
 */
export function rowToTrip(row: Record<string, string>): Trip | null {
  const startLat = parseFloat(row.journey_start_lat);
  const startLon = parseFloat(row.journey_start_lon);
  if (isNaN(startLat) || isNaN(startLon)) return null;

  const endLat = parseFloat(row.journey_end_lat);
  const endLon = parseFloat(row.journey_end_lon);

  return {
    journey_id: row.journey_id || row.trip_id || "",
    datetime: row.journey_start_datetime || "",
    journey_start_lat: startLat,
    journey_start_lon: startLon,
    journey_start_town: row.journey_start_town || undefined,
    journey_end_lat: isNaN(endLat) ? undefined : endLat,
    journey_end_lon: isNaN(endLon) ? undefined : endLon,
    journey_end_town: row.journey_end_town || undefined,
    journey_distance: parseInt(row.journey_distance, 10) || 0,
    operator_class: row.operator_class || undefined,
    passenger_seats: parseInt(row.passenger_seats, 10) || 1,
  };
}

/** Parses a complete CSV document (header row included) into Trips. */
export function parseTripsCsv(csv: string): Trip[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    delimiter: CSV_DELIMITER,
    skipEmptyLines: true,
  });

  const trips: Trip[] = [];
  for (const row of result.data) {
    const trip = rowToTrip(row);
    if (trip) trips.push(trip);
  }
  return trips;
}

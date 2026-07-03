import { describe, it, expect } from "vitest";
import { parseTripsCsv, rowToTrip } from "./parseTrips";

// Header and row shapes copied from the real RPC dataset
const HEADER =
  '"journey_id";"trip_id";"journey_start_datetime";"journey_start_date";"journey_start_time";"journey_start_lon";"journey_start_lat";"journey_start_insee";"journey_start_department";"journey_start_town";"journey_start_towngroup";"journey_start_country";"journey_end_datetime";"journey_end_date";"journey_end_time";"journey_end_lon";"journey_end_lat";"journey_end_insee";"journey_end_department";"journey_end_town";"journey_end_towngroup";"journey_end_country";"passenger_seats";"operator_class";"journey_distance";"journey_duration";"has_incentive"';

const ROW =
  '"51599592";"94b0d2ae";"2025-02-01T00:00:00+0100";"2025-02-01";"00:00:00";"3.856";"43.588";"34172";"34";"Montpellier";"Montpellier Méditerranée Métropole";"France";"2025-02-01T00:00:00+0100";"2025-02-01";"00:10:00";"3.877";"43.610";"34172";"34";"Montpellier";"Montpellier Méditerranée Métropole";"France";1;"C";3805;"9";"OUI"';

describe("parseTripsCsv", () => {
  it("parses semicolon-delimited RPC rows into Trips", () => {
    const trips = parseTripsCsv(`${HEADER}\n${ROW}\n`);

    expect(trips).toHaveLength(1);
    expect(trips[0]).toMatchObject({
      journey_id: "51599592",
      datetime: "2025-02-01T00:00:00+0100",
      journey_start_lat: 43.588,
      journey_start_lon: 3.856,
      journey_start_town: "Montpellier",
      journey_end_lat: 43.61,
      journey_end_lon: 3.877,
      journey_end_town: "Montpellier",
      journey_distance: 3805,
      operator_class: "C",
      passenger_seats: 1,
    });
  });

  it("drops rows without valid start coordinates", () => {
    const badRow = ROW.replace('"3.856";"43.588"', '"";""');
    const trips = parseTripsCsv(`${HEADER}\n${badRow}\n${ROW}\n`);
    expect(trips).toHaveLength(1);
  });
});

describe("rowToTrip", () => {
  it("returns null when start coordinates are missing", () => {
    expect(rowToTrip({ journey_start_lat: "", journey_start_lon: "" })).toBe(
      null
    );
  });

  it("leaves end coordinates undefined when absent", () => {
    const trip = rowToTrip({
      journey_id: "x",
      journey_start_lat: "48.85",
      journey_start_lon: "2.35",
    });
    expect(trip?.journey_end_lat).toBeUndefined();
    expect(trip?.passenger_seats).toBe(1);
  });
});

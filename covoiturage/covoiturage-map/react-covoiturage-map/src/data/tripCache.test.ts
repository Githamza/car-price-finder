import { describe, it, expect } from "vitest";
import { isCacheValid, TripCacheMeta } from "./tripCache";

const NOW = 1_750_000_000_000;
const DAY = 24 * 3600 * 1000;

function meta(overrides: Partial<TripCacheMeta> = {}): TripCacheMeta {
  return {
    resourceId: "res-1",
    checksum: "abc",
    rowCap: 100_000,
    tripCount: 100_000,
    storedAt: NOW - DAY,
    ...overrides,
  };
}

describe("isCacheValid", () => {
  it("accepts a cache whose checksum matches the remote resource", () => {
    expect(
      isCacheValid(meta(), { checksum: "abc", lastModified: null, url: null }, "res-1", 100_000, NOW)
    ).toBe(true);
  });

  it("rejects when the remote checksum changed (new monthly file)", () => {
    expect(
      isCacheValid(meta(), { checksum: "def", lastModified: null, url: null }, "res-1", 100_000, NOW)
    ).toBe(false);
  });

  it("rejects when the configured resource id changed", () => {
    expect(
      isCacheValid(meta(), { checksum: "abc", lastModified: null, url: null }, "res-2", 100_000, NOW)
    ).toBe(false);
  });

  it("rejects a truncated cache when the cap was raised", () => {
    expect(
      isCacheValid(meta(), { checksum: "abc", lastModified: null, url: null }, "res-1", 200_000, NOW)
    ).toBe(false);
  });

  it("accepts a bigger cap when the whole file fit under the old cap", () => {
    // tripCount < rowCap means the file was fully consumed — nothing to gain
    expect(
      isCacheValid(
        meta({ tripCount: 42_000 }),
        { checksum: "abc", lastModified: null, url: null },
        "res-1",
        200_000,
        NOW
      )
    ).toBe(true);
  });

  it("falls back to a 7-day TTL when metadata is unreachable", () => {
    expect(isCacheValid(meta(), null, "res-1", 100_000, NOW)).toBe(true);
    expect(
      isCacheValid(meta({ storedAt: NOW - 8 * DAY }), null, "res-1", 100_000, NOW)
    ).toBe(false);
  });
});

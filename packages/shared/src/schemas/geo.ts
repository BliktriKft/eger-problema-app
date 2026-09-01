import { z } from "zod";

/** Latitude in WGS84 degrees. */
export const LatitudeSchema = z
  .number()
  .gte(-90, "Latitude must be >= -90")
  .lte(90, "Latitude must be <= 90");

/** Longitude in WGS84 degrees. */
export const LongitudeSchema = z
  .number()
  .gte(-180, "Longitude must be >= -180")
  .lte(180, "Longitude must be <= 180");

/** A geographic point (WGS84). */
export const GeoPointSchema = z.object({
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
});

/** Bounding-box query (south-west + north-east corner). */
export const BoundingBoxSchema = z
  .object({
    minLat: LatitudeSchema,
    minLng: LongitudeSchema,
    maxLat: LatitudeSchema,
    maxLng: LongitudeSchema,
  })
  .refine(
    (b) => b.minLat <= b.maxLat && b.minLng <= b.maxLng,
    "Bounding box is inverted (min > max)",
  );

/** Radius query in metres (1 m .. 50 km). */
export const RadiusSchema = z
  .number()
  .int()
  .gte(1, "Radius must be >= 1 m")
  .lte(50_000, "Radius must be <= 50 km");
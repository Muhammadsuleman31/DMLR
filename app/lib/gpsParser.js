export function extractPoints(geojson) {
  const points = [];

  if (!geojson || !geojson.features) return points;

  geojson.features.forEach((feature) => {
    if (feature.geometry?.type !== "Point") return;

    const coords = feature.geometry.coordinates || [];
    const lon = coords[0];
    const lat = coords[1];
    const height = coords[2] || 0;

    const name = feature.properties?.name || "UNKNOWN";
    const time = feature.properties?.time || "NO_TIME";

    points.push({
      name,
      time,
      latitude: lat,
      longitude: lon,
      height
    });
  });

  return points;
}

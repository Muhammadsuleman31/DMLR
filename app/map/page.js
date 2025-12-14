"use client";

import { useState } from "react";
import FileUpload from "../component/fileupload/fileupload";
import MapCanvas from "../component/mapCanvas";
import { extractPoints } from "../lib/gpsParser";
import { insertPoints } from "../lib/pointStore";

export default function MapPage() {
  const [points, setPoints] = useState([]);

  function handleGPSData(geojson) {
    const extracted = extractPoints(geojson);
    const stored = insertPoints(extracted);

    if (stored.length === 0) return;

    // --- NORMALIZATION ---
    const lats = stored.map(p => p.latitude);
    const lons = stored.map(p => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const width = 800;
    const height = 600;
    const padding = 60;

    const normalized = stored.map(p => ({
      ...p,
      x:
        ((p.longitude - minLon) / (maxLon - minLon || 1)) *
          (width - padding * 2) +
        padding,
      y:
        ((maxLat - p.latitude) / (maxLat - minLat || 1)) *
          (height - padding * 2) +
        padding
    }));

    setPoints(normalized);
  }

  function updatePoint(index, x, y) {
    const updated = [...points];
    updated[index] = { ...updated[index], x, y };
    setPoints(updated);
  }

  return (
    <div>
      <h2>Digital Land Map</h2>

      <FileUpload onData={handleGPSData} />

      <MapCanvas points={points} onPointUpdate={updatePoint} />
    </div>
  );
}

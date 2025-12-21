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

    const mainPoint = stored[0];
    const mainLat = mainPoint.latitude;
    const mainLon = mainPoint.longitude;

    // Standard conversion: 1 degree lat ≈ 111,000 meters
    // 1 Karam ≈ 1.6764 meters (5.5 ft)
    const karamInMeters = 5.5 / 3.28084;
    const latMultiplier = 111000 / karamInMeters;

    // 1. First Pass: Calculate raw Karam distances relative to the start
    const rawKaramPoints = stored.map((p) => {
      const deltaLat = p.latitude - mainLat;
      const deltaLon = p.longitude - mainLon;

      const avgLat = (p.latitude + mainLat) / 2;
      const cosFactor = Math.cos(avgLat * (Math.PI / 180));
      const longMultiplier = (111000 * cosFactor) / karamInMeters;

      return {
        ...p,
        karamX: deltaLon * longMultiplier,
        // Multiply by -1 here so that 'North' is a smaller Y value (higher on screen)
        karamY: (deltaLat * latMultiplier) * -1, 
      };
    });

    // 2. Find the minimum values to "zero out" the map
    const minX = Math.min(...rawKaramPoints.map(p => p.karamX));
    const minY = Math.min(...rawKaramPoints.map(p => p.karamY));

    // 3. Second Pass: Apply Offset and Scale
    const visualScale = 2; 
    const padding = 50; // 50px offset from the top-left edge

    const finalPoints = rawKaramPoints.map((p) => ({
      ...p,
      // (Value - MinValue) ensures the lowest number is 0, then we add padding
      x: (p.karamX - minX) * visualScale + padding,
      y: (p.karamY - minY) * visualScale + padding
    }));

    console.log("Map bounds calculated:", { minX, minY });
    setPoints(finalPoints);
  }

  function updatePoint(index, x, y) {
    const updated = [...points];
    updated[index] = { ...updated[index], x, y };
    setPoints(updated);
  }

  return (
    <div>
      <div style={{ padding: "10px", background: "#f4f4f4", marginBottom: "10px" }}>
        <h2 style={{ margin: 0 }}>Digital Land Map</h2>
        <p style={{ margin: "5px 0" }}>
          Distances in <b>Karams</b> (1 Karam = 5.5ft). 
          Map origin shifted to (0,0) for visibility.
        </p>
      </div>

      <FileUpload onData={handleGPSData} />

      <div style={{ marginTop: "20px", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
        <MapCanvas points={points} onPointUpdate={updatePoint} />
      </div>
    </div>
  );
}
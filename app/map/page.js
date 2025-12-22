"use client";
import { useState, useEffect } from "react";
import FileUpload from "../component/fileupload/fileupload";
import MapCanvas from "../component/mapCanvas";
import { extractPoints } from "../lib/gpsParser";
import { insertPoints } from "../lib/pointStore";

export default function MapPage() {
  const [points, setPoints] = useState([]);
  const [uploadInfo, setUploadInfo] = useState(null); // For summary info

  // 🔹 LOAD SAVED POINTS ON PAGE LOAD
  useEffect(() => {
    const loadSaved = async () => {
      const res = await fetch("/api/save-points");
      const saved = await res.json();
      if (Array.isArray(saved)) setPoints(saved);
    };
    loadSaved();
  }, []);

  function handleGPSData(geojson) {
    const extracted = extractPoints(geojson);
    const stored = insertPoints(extracted);
    if (stored.length === 0) return;

    const main = stored[0];
    const karamInMeters = 5.5 / 3.28084;
    const latMultiplier = 111000 / karamInMeters;

    const raw = stored.map((p) => {
      const deltaLat = p.latitude - main.latitude;
      const deltaLon = p.longitude - main.longitude;
      const avgLat = (p.latitude + main.latitude) / 2;
      const cosFactor = Math.cos(avgLat * Math.PI / 180);
      const longMultiplier = (111000 * cosFactor) / karamInMeters;

      return {
        ...p,
        key: `${p.name}_${p.time}`,
        karamX: deltaLon * longMultiplier,
        karamY: deltaLat * latMultiplier * -1,
      };
    });

    const minX = Math.min(...raw.map(p => p.karamX));
    const minY = Math.min(...raw.map(p => p.karamY));

    const final = raw.map(p => ({
      ...p,
      x: (p.karamX - minX) * 2 + 50,
      y: (p.karamY - minY) * 2 + 50,
    }));

    // 🔹 Check which uploaded points already exist in the current points
    const existingKeys = new Set(points.map(p => p.key));
    const alreadyExists = final.filter(p => existingKeys.has(p.key));
    const newPoints = final.filter(p => !existingKeys.has(p.key));

    // 🔹 Update points state with only new points
    if (newPoints.length > 0) {
      setPoints(prev => [...prev, ...newPoints]);
    }

    // 🔹 Show summary info
    const matchedCount = alreadyExists.length;
    const totalCount = final.length;
    const percentage = ((matchedCount / totalCount) * 100).toFixed(0);
    setUploadInfo({
      matchedCount,
      totalCount,
      percentage
    });
  }

  function updatePoint(index, x, y) {
    setPoints(prev =>
      prev.map((p, i) => (i === index ? { ...p, x, y } : p))
    );
  }
  function deletePoint(index) {
  setPoints(prev => prev.filter((_, i) => i !== index));
}


  return (
    <>
      <div style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>
        <FileUpload onData={handleGPSData} />
        {uploadInfo && (
          <div style={{ marginTop: '8px', color: '#333' }}>
            <b>Uploaded points summary:</b> {uploadInfo.matchedCount} of {uploadInfo.totalCount} points already exist ({uploadInfo.percentage}%)
          </div>
        )}
      </div>
      <MapCanvas points={points}  onDeletePoint={deletePoint} onPointUpdate={updatePoint} />
    </>
  );
}

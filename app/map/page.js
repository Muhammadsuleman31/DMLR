"use client";
import { useState, useEffect } from "react";
import FileUpload from "../component/fileupload/fileupload";
import MapCanvas from "../component/mapCanvas";
import { extractPoints } from "../lib/gpsParser";
import { insertPoints } from "../lib/pointStore";

export default function MapPage() {
  const [globalRef, setGlobalRef] = useState(null);
  const [points, setPoints] = useState([]);
  const [savedPoints, setSavedPoints] = useState([]);
  const [plots, setPlots] = useState([]); // store fetched plots
  const [uploadInfo, setUploadInfo] = useState(null); // For summary info

  // 🔹 LOAD SAVED POINTS ON PAGE LOAD
  useEffect(() => {
    const loadSaved = async () => {
      const res = await fetch("/api/save-points");
      const saved = await res.json();
      if (Array.isArray(saved))
        {
          setPoints(saved);
          setSavedPoints(JSON.parse(JSON.stringify(saved))); // deep copy
          setGlobalRef(saved[0]);
        } 

        const resPlots = await fetch("/api/save-plot");
      const savedPlotsData = await resPlots.json();
      if (Array.isArray(savedPlotsData)) {
        setPlots(savedPlotsData);
      }

    };
    loadSaved();
  }, []);

  function handleGPSData(geojson) {
    const extracted = extractPoints(geojson);
    const stored = insertPoints(extracted);
    if (extracted.length === 0) return;

    let referencePoint = globalRef;
  if (!referencePoint) {
    referencePoint = extracted[0];
    setGlobalRef(referencePoint); // Lock this in for future uploads
  }
    const karamInMeters = 5.5 / 3.28084;
    const latMultiplier = 111000 / karamInMeters;

    const newRaw = extracted.map((p) => {
      const deltaLat = p.latitude - referencePoint.latitude;
      const deltaLon = p.longitude - referencePoint.longitude;
      const avgLat = (p.latitude + referencePoint.latitude) / 2;
      const cosFactor = Math.cos(avgLat * Math.PI / 180);
      const longMultiplier = (111000 * cosFactor) / karamInMeters;

      return {
        ...p,
        key: `${p.name}_${p.time}`,
        karamX: deltaLon * longMultiplier,
        karamY: deltaLat * latMultiplier * -1,
      };
    });

    const existingPoint = new Set(points.map((p) => p.key));
     const newPointsOnly = newRaw.filter((p) => !existingPoint.has(p.key));
     const matchedCount = extracted.length - newPointsOnly.length;

   // 3. Combine with existing points to find the NEW global boundaries
  const CombinedPoints = [...points, ...newPointsOnly];
//   const globalMinX = Math.min(...allPointsSync.map((p) => p.karamX));
//   const globalMinY = Math.min(...allPointsSync.map((p) => p.karamY));
// console.log(globalMinX,globalMinY);
//   // 4. Re-calculate X and Y for EVERY point (old and new) based on the new boundaries
//   const updatedAllPoints = allPointsSync.map((p) => ({
//     ...p,
//     x: (p.karamX - globalMinX) * 2 + 50,
//     y: (p.karamY - globalMinY) * 2 + 50,
//   }));


 // 6. Update the state with the fully re-positioned list
  if (newPointsOnly.length > 0) {
    setPoints(CombinedPoints); // This replaces the old state with the newly aligned points
  }
  

   // 7. Summary info
setUploadInfo({
    matchedCount: matchedCount,
    totalCount: extracted.length,
    percentage: ((matchedCount / extracted.length) * 100).toFixed(0),
  });
  }

function updatePoint(pointKey, targetKaramX, targetKaramY) {
  setPoints((prev) => {
 

      return prev.map((p) =>
        p.key === pointKey 
          ? { ...p, karamX: targetKaramX, karamY: targetKaramY } 
          : p
      );

    // if (isNewMin) {
    //   // 🚀 GLOBAL SHIFT: Recalculate everyone
    //   const newGlobalMinX = Math.min(targetKaramX, currentMinX);
    //   const newGlobalMinY = Math.min(targetKaramY, currentMinY);

    //   return prev.map((p) => {
    //     const kX = p.key === pointKey ? targetKaramX : p.karamX;
    //     const kY = p.key === pointKey ? targetKaramY : p.karamY;
    //     return {
    //       ...p,
    //       karamX: kX,
    //       karamY: kY,
    //       x: (kX - newGlobalMinX) * 2 + 50,
    //       y: (kY - newGlobalMinY) * 2 + 50,
    //     };
    //   });
    // } else {
    //   // 🎯 LOCAL UPDATE: Only update the target point
    //   return prev.map((p) =>
    //     p.key === pointKey 
    //       ? { ...p, x: newX, y: newY, karamX: targetKaramX, karamY: targetKaramY } 
    //       : p
    //   );
    // }
  });
}
const markPointsAsSaved = () => {
  setSavedPoints(JSON.parse(JSON.stringify(points)));
};


const resetPoints = () => {
  setPoints(JSON.parse(JSON.stringify(savedPoints)));
};
  const updatePlots = (newPlot) => {
    setPlots((prev) => [...prev, newPlot]);
  };

function deletePoint(pointKey) {
  console.log(pointKey)
  setPoints(prev => prev.filter(p => p.key !== pointKey));
  console.log(points)
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
      <MapCanvas plots={plots} updatePlots={updatePlots} points={points} onDeletePoint={deletePoint} onPointUpdate={updatePoint} onReset={resetPoints} onSaveSuccess={markPointsAsSaved}/>
    </>
  );
}

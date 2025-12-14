"use client";

import { useState } from "react";
import FileUpload from "../component/fileupload/fileupload";
import { extractPoints } from "../lib/gpsParser";
import { insertPoints } from "../lib/pointStore";

export default function MapPage() {
  const [points, setPoints] = useState([]);

  function handleGPSData(geojson) {
    const extracted = extractPoints(geojson);
    const stored = insertPoints(extracted);
    setPoints([...stored]);
  }

  return (
    <div>
      <h1>GPS Point Store</h1>

      <FileUpload onData={handleGPSData} />

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Name</th>
            <th>Time</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Height</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={`${p.name}-${p.time}`}>
              <td>{p.name}</td>
              <td>{p.time}</td>
              <td>{p.latitude}</td>
              <td>{p.longitude}</td>
              <td>{p.height}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

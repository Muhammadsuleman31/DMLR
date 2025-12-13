"use client";

import { useState } from "react";
import { DOMParser } from "xmldom";
import { gpx, kml } from "@tmcw/togeojson";

export default function FileUpload({ onData }) {
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const xml = new DOMParser().parseFromString(reader.result);
        let geojson;

        if (file.name.endsWith(".gpx")) geojson = gpx(xml);
        else if (file.name.endsWith(".kml")) geojson = kml(xml);
        else throw new Error("Unsupported file");

        onData(geojson);
      } catch (err) {
        setError("Invalid GPS file");
      }
    };

    reader.readAsText(file);
  }

  return (
    <div>
      <input type="file" accept=".gpx,.kml" onChange={handleFile} />
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

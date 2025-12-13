"use client";

import { useState } from "react";
import FileUpload from "../component/fileupload/fileupload";

export default function MapPage() {
  const [data, setData] = useState(null);

  return (
    <div>
      <h1>GPS Map</h1>
      <FileUpload onData={setData} />
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

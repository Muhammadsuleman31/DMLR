"use client";
import { Stage, Layer, Circle, Text, Line, Group } from "react-konva";
import React, { useState, useEffect } from "react";

export default function MapCanvas({ points, onPointUpdate, onDeletePoint }) {
  const [size, setSize] = useState({ width: 1000, height: 800 });
  const [connections, setConnections] = useState([]);

  const [selectedPointKey, setSelectedPointKey] = useState(null);

 const [hoveredLineKey, setHoveredLineKey] = useState(null);



const removeConnectionsForDeletedPoint = (deletedKey) => {
  setConnections(prev =>
    prev.filter(([key1, key2]) => key1 !== deletedKey && key2 !== deletedKey)
  );
};



  // ===== Save points =====
  const savePointsToDB = async () => {
  const res = await fetch("/api/save-points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ points }), // just send points directly
  });

  if (!res.ok) {
    alert("Failed to save points");
    return;
  }
  alert("Points saved successfully");
};


  // ===== Delete selected point =====
const deleteSelectedPoint = async () => {
  if (selectedPointKey === null) return;
  const point = points.find(p => p.key === selectedPointKey);
  if (!point) return;
  if (!window.confirm(`Delete point "${point.name}"?`)) return;

  try {
    // Call backend to delete point
const res = await fetch("/api/delete-point", {
  method: "DELETE", // or POST depending on your API
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({  key: point.key }),
});

    if (!res.ok) {
      alert("Failed to delete point from database");
      return;
    }
     removeConnectionsForDeletedPoint(point.key); // instead of index

    // Remove from local state
    onDeletePoint(point.key);
     setSelectedPointKey(null);
    alert(`Point "${point.name}" deleted successfully`);
  } catch (err) {
    console.error(err);
    alert("An error occurred while deleting the point");
  }
};



  const BLACK = "#000000";
  const NAVY = "#000080";
  const STROKE_WIDTH = 0.5;
  const POINT_RADIUS = STROKE_WIDTH / 2;

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight - 150 });
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

const getKaramDistance = (key1, key2) => {
  const p1 = points.find(p => p.key === key1);
  const p2 = points.find(p => p.key === key2);

  if (!p1 || !p2) return 0; // safety check if points not found

  const dx = p1.karamX - p2.karamX;
  const dy = p1.karamY - p2.karamY;
  return Math.sqrt(dx * dx + dy * dy).toFixed(2);
};

const connectionExists = (a, b) => {
  return connections.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
};


const handlePointClick = (pointKey) => {
  console.log(connections)
  if (selectedPointKey === null) {
    // First click → select
    setSelectedPointKey(pointKey);
    return;
  }

  if (selectedPointKey === pointKey) {
    // Same point clicked again → deselect
    setSelectedPointKey(null);
    return;
  }

  // Prevent duplicate or reverse duplicate
  if (connectionExists(selectedPointKey, pointKey)) {
    console.log("Connection already exists");
    setSelectedPointKey(null);
    return;
  }

  // Add new connection
  setConnections(prev => [...prev, [selectedPointKey, pointKey]]);
  setSelectedPointKey(null);
  
};


  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  return (
    <div style={{ position: "relative", backgroundColor: "#fff" }}>
      {/* ===== Buttons ===== */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: "8px" }}>
        <button
          onClick={savePointsToDB}
          style={{
            fontSize: "10px",
            padding: "4px 6px",
            background: "white",
            border: "1px solid black",
            cursor: "pointer",
          }}
        >
          SAVE UPDATED POINTS
        </button>
        {selectedPointKey !== null && (
        <button
          onClick={deleteSelectedPoint}
          style={{
            fontSize: "10px",
            padding: "4px 6px",
            background: "red",
            color: "white",
            border: "1px solid black",
            cursor: selectedPointKey !== null ? "pointer" : "not-allowed",
            opacity: selectedPointKey !== null ? 1 : 0.5,
          }}
        >
          DELETE SELECTED
        </button>)}
      </div>

      <Stage width={size.width} height={size.height} draggable onWheel={handleWheel}>
        <Layer>
          {/* ===== Lines ===== */}
 {connections.map((conn) => {
  const p1 = points.find(p => p.key === conn[0]);
  const p2 = points.find(p => p.key === conn[1]);
  
  if (!p1 || !p2) return null; // safety check in case points are deleted

  const lineKey = `${conn[0]}-${conn[1]}`;
  const isHovered = hoveredLineKey === lineKey;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
  if (rotation > 90 || rotation < -90) rotation += 180;

  

  return (
    <Group
      key={lineKey}
      onMouseEnter={() => setHoveredLineKey(lineKey)}
      onMouseLeave={() => setHoveredLineKey(null)}
      onTouchStart={() => setHoveredLineKey(lineKey)}
      onTouchEnd={()     =>   setHoveredLineKey(null)}
    >
      <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="transparent" strokeWidth={0.5} />
      <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke={BLACK} strokeWidth={STROKE_WIDTH} />
      { (
        <Text
          x={(p1.x + p2.x) / 2}
          y={(p1.y + p2.y) / 2}
          text={`${getKaramDistance(p1.key, p2.key)} K`}
          fontSize={2}
          fontFamily="monospace"
          fill={NAVY}
          rotation={rotation}
          align="center"
          offsetY={2}
          offsetX={3}
        />
      )}
    </Group>
  );
})}



          {/* ===== Points ===== */}
          {points.map((p) => {
            const isSelected = selectedPointKey === p.key;
            return (
              <React.Fragment key={p.key}>
                <Circle
                  x={p.x}
                  y={p.y}
                  radius={POINT_RADIUS}
                  fill={isSelected ? NAVY : BLACK}
                  onClick={() => handlePointClick(p.key)}
                  onTap={() => handlePointClick(p.key)}
                  draggable
                  onDragEnd={(e) => onPointUpdate(p.key, e.target.x(), e.target.y())}
                />
                <Text x={p.x - 2} y={p.y - 3} text={p.name.toUpperCase()} fontSize={3} fontFamily="monospace" fill={BLACK} />
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

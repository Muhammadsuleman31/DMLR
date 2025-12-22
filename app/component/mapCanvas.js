"use client";
import { Stage, Layer, Circle, Text, Line, Group } from "react-konva";
import React, { useState, useEffect } from "react";

export default function MapCanvas({ points, onPointUpdate, onDeletePoint }) {
  const [size, setSize] = useState({ width: 1000, height: 800 });
  const [connections, setConnections] = useState([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);


  const removeConnectionsForDeletedPoint = (deletedIndex) => {
  setConnections((prevConnections) =>
    prevConnections
      .filter(
        ([i, j]) => i !== deletedIndex && j !== deletedIndex // remove connections involving deleted point
      )
      .map(([i, j]) => [
        i > deletedIndex ? i - 1 : i, // shift indices after deletion
        j > deletedIndex ? j - 1 : j,
      ])
  );
};


  // ===== Save points =====
  const savePointsToDB = async () => {
    const payload = points.map((p) => ({
      key: `${p.name}_${p.time}`,
      ...p,
    }));

    const res = await fetch("/api/save-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: payload }),
    });

    if (!res.ok) {
      alert("Failed to save points");
      return;
    }
    alert("Points saved successfully");
  };

  // ===== Delete selected point =====
const deleteSelectedPoint = async () => {
  if (selectedPointIndex === null) return;
  const point = points[selectedPointIndex];
  const key = `${point.name}_${point.time}`;

  if (!window.confirm(`Delete point "${point.name}"?`)) return;

  try {
    // Call backend to delete point
const res = await fetch("/api/delete-point", {
  method: "DELETE", // or POST depending on your API
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key }),
});

    if (!res.ok) {
      alert("Failed to delete point from database");
      return;
    }
     removeConnectionsForDeletedPoint(selectedPointIndex);
    // Remove from local state
    onDeletePoint(selectedPointIndex);
    setSelectedPointIndex(null);
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

  const getKaramDistance = (idx1, idx2) => {
    const p1 = points[idx1];
    const p2 = points[idx2];
    const dx = p1.karamX - p2.karamX;
    const dy = p1.karamY - p2.karamY;
    return Math.sqrt(dx * dx + dy * dy).toFixed(2);
  };

const handlePointClick = (index) => {
  if (selectedPointIndex === null) {
    setSelectedPointIndex(index);
  } else if (selectedPointIndex === index) {
    setSelectedPointIndex(null);
  } else {
    // Add connection
    setConnections([...connections, [selectedPointIndex, index]]);
    setSelectedPointIndex(null);
  }
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
        {selectedPointIndex !== null && (
        <button
          onClick={deleteSelectedPoint}
          style={{
            fontSize: "10px",
            padding: "4px 6px",
            background: "red",
            color: "white",
            border: "1px solid black",
            cursor: selectedPointIndex !== null ? "pointer" : "not-allowed",
            opacity: selectedPointIndex !== null ? 1 : 0.5,
          }}
        >
          DELETE SELECTED
        </button>)}
      </div>

      <Stage width={size.width} height={size.height} draggable onWheel={handleWheel}>
        <Layer>
          {/* ===== Lines ===== */}
          {connections.map((conn, i) => {
            const p1 = points[conn[0]];
            const p2 = points[conn[1]];
            const isHovered = hoveredLineIndex === i;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
            if (rotation > 90 || rotation < -90) rotation += 180;

            return (
              <Group
                key={`line-${i}`}
                onMouseEnter={() => setHoveredLineIndex(i)}
                onMouseLeave={() => setHoveredLineIndex(null)}
                onTouchStart={() => setHoveredLineIndex(i)}
                onTouchEnd={() => setHoveredLineIndex(null)}
              >
                <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="transparent" strokeWidth={15} />
                <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke={BLACK} strokeWidth={STROKE_WIDTH} />
                {isHovered && (
                  <Text
                    x={(p1.x + p2.x) / 2}
                    y={(p1.y + p2.y) / 2}
                    text={`${getKaramDistance(conn[0], conn[1])} K`}
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
          {points.map((p, i) => {
            const isSelected = selectedPointIndex === i;
            return (
              <React.Fragment key={`${p.name}-${p.time}`}>
                <Circle
                  x={p.x}
                  y={p.y}
                  radius={POINT_RADIUS}
                  fill={isSelected ? NAVY : BLACK}
                  onClick={() => handlePointClick(i)}
                  onTap={() => handlePointClick(i)}
                  draggable
                  onDragEnd={(e) => onPointUpdate(i, e.target.x(), e.target.y())}
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

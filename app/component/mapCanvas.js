"use client";
import { Stage, Layer, Circle, Text, Line, Group } from "react-konva";
import React, { useState, useEffect, useRef } from "react";

export default function MapCanvas({ points, onPointUpdate, onDeletePoint , onReset, onSaveSuccess, plots , updatePlots  }) {
  const [size, setSize] = useState({ width: 1000, height: 800 });
  const [connections, setConnections] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState(null);
const [isPolygonClosed, setIsPolygonClosed] = useState(false); // show save button
const stageRef = useRef(null);
  const [selectedPointKey, setSelectedPointKey] = useState(null);
const [creatingPlot, setCreatingPlot] = useState(false); // NEW: are we creating a plot?
const [currentPlotPoints, setCurrentPlotPoints] = useState([]); // stores clicked points for the plot
const [currentScale, setCurrentScale] = useState(1);
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
  if (typeof onSaveSuccess === "function") {
    onSaveSuccess(); // ✅ snapshot saved
  }
  alert("Points saved successfully");
};



const Resetall = () => {
  if (!window.confirm("Discard all unsaved point movements?")) return;

  setConnections([]);
  setSelectedPointKey(null);
  setCreatingPlot(false);
  setCurrentPlotPoints([]);

  if (typeof onReset === "function") {
    onReset(); // 🔥 restore points
  }
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
 
const drawTemporaryPlotLines = (plotArray) => {
  if (plotArray.length < 2) return; // need at least 2 points

  const newConnections = [];

  for (let i = 1; i < plotArray.length; i++) {
    newConnections.push([plotArray[i - 1], plotArray[i]]);
  }

  

  // Merge new connections into existing connections
  setConnections(prev => {
    const combined = [...prev];
    newConnections.forEach(([a,b]) => {
      // Avoid duplicates
      if (!combined.some(([x,y]) => (x===a && y===b) || (x===b && y===a))) {
        combined.push([a,b]);
      }
    });
    return combined;
  });
};

const savePlotData = async () => {
  const name = prompt("Enter plot (kharsa) name:");
  if (!name) return;

  const plot = {
    id: crypto.randomUUID(),  // unique key for React
    name,
    pointKeys: currentPlotPoints,
  };

  try {
    const res = await fetch("/api/save-plot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plot),
    });

    if (!res.ok) {
      alert("Failed to save plot");
      return;
    }

    alert(`Plot "${name}" saved successfully!`);

    // Reset after saving
    setCurrentPlotPoints([]);
    setSelectedPointKey(null);
    setCreatingPlot(false);
    setIsPolygonClosed(false);
    setConnections([]);

    // ✅ Add locally
   if (updatePlots) updatePlots(plot);

  } catch (err) {
    console.error(err);
    alert("An error occurred while saving the plot");
  }
};




  //  console.log("current pplot points",currentPlotPoints)
const handlePointClick = (pointKey) => {
  console.log("current pplot points",currentPlotPoints);
  console.log("connecti ",connections);
  if (creatingPlot) {
    const lastPlotPoint =
      currentPlotPoints[currentPlotPoints.length - 1] || null;

    // 🔁 Toggle selection
    if (selectedPointKey === pointKey) {
      setSelectedPointKey(null);
      return;
    }

    // 🟢 START PLOT (FIRST POINT)
    if (currentPlotPoints.length === 0) {
      setCurrentPlotPoints([pointKey]);
      setSelectedPointKey(pointKey);
      drawTemporaryPlotLines([pointKey]);
      return;
    }

    // 🟡 Nothing selected → just select
    if (selectedPointKey === null) {
      setSelectedPointKey(pointKey);
      return;
    }

    // 🔴 Enforce sequential rule
    if (selectedPointKey !== lastPlotPoint) {
      setSelectedPointKey(pointKey);
      return;
    }


      // 🔁 Close polygon
    if (
      pointKey === currentPlotPoints[0] &&
      currentPlotPoints.length >= 3
    ) {
       drawTemporaryPlotLines([...currentPlotPoints, pointKey]);
      setIsPolygonClosed(true);
      setSelectedPointKey(null);
      return;
    }

    // 🔒 Prevent duplicates
    if (currentPlotPoints.includes(pointKey)) {
      setSelectedPointKey(pointKey);
      return;
    }

  

    // ✅ VALID ADD
    const newPlotArray = [...currentPlotPoints, pointKey];
    setCurrentPlotPoints(newPlotArray);
    setSelectedPointKey(pointKey);
    drawTemporaryPlotLines(newPlotArray);
    return;
  }

  // ===== EXISTING CONNECTION LOGIC (UNCHANGED) =====
  if (selectedPointKey === null) {
    setSelectedPointKey(pointKey);
    return;
  }

  if (selectedPointKey === pointKey) {
    setSelectedPointKey(null);
    return;
  }

  if (connectionExists(selectedPointKey, pointKey)) {
    console.log("connection exist")
    setSelectedPointKey(null);
    return;
  }

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
    setCurrentScale(newScale);
  };

  const handleStageClick = (e) => {
  // If clicked on empty area (not on shape)
  if (e.target === e.target.getStage()) {
    setSelectedPlotId(null);
    setSelectedPointKey(null); // optional but recommended
  }
};


  const getPolygonPoints = (plot) => {
  return plot.pointKeys.flatMap(key => {
    const p = points.find(pt => pt.key === key);
    return p ? [p.x, p.y] : [];
  });
};

const getPlotCenter = (plot) => {
  const polygonPoints = getPolygonPoints(plot); // [x1, y1, x2, y2...]
  if (polygonPoints.length === 0) return { x: 0, y: 0 };

  let totalX = 0;
  let totalY = 0;
  
  for (let i = 0; i < polygonPoints.length; i += 2) {
    totalX += polygonPoints[i];
    totalY += polygonPoints[i + 1];
  }

  return {
    x: totalX / (polygonPoints.length / 2),
    y: totalY / (polygonPoints.length / 2),
  };
};


  return (
    <div style={{ position: "relative", backgroundColor: "#fff" }}>
     
      {/* ===== Buttons ===== */}
       
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: "8px" }}>
     
    {isPolygonClosed && (
  <button
    style={{
      fontSize: "10px",
      padding: "4px 6px",
      background: "black",
      color: "white",
      border: "1px solid black",
      cursor: "pointer",
    }}
    onClick={savePlotData}
  >
    SAVE PLOT
  </button>
)}

     <button
  style={{
    fontSize: "10px",
    padding: "4px 6px",
    background: creatingPlot ? "green" : "lightblue", // red when active
    color: "white",
    border: "1px solid black",
    cursor: "pointer",
  }}
  onClick={() => {
   setCurrentPlotPoints([]);
    setIsPolygonClosed(false);
   setConnections([]);
  setCreatingPlot(prev => !prev)}} // toggle
>
  {creatingPlot ? "CANCEL" : "CREATE PLOT"}
</button>
   <button
          onClick={Resetall}
          style={{
            fontSize: "10px",
            padding: "4px 6px",
            background: "white",
            border: "1px solid black",
            cursor: "pointer",
          }}
        >
          Reset
        </button>

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

      <Stage width={size.width} height={size.height} draggable onWheel={handleWheel}  ref={stageRef} onClick={handleStageClick}
  onTap={handleStageClick}>
        <Layer>


{plots.map(plot => {
  const polygonPoints = getPolygonPoints(plot);

  if (polygonPoints.length < 6) return null; // need 3 points
   const isSelected = selectedPlotId === plot.id;
   const center = getPlotCenter(plot);
  return (
    <Group key={plot.id}>
    <Line
      points={polygonPoints}
      closed
       fill={isSelected ? "rgba(0,0,255,0.25)" : "rgba(0,128,0,0.15)"}
      stroke={isSelected ? "blue" : "green"}
      strokeWidth={0.5}
      lineJoin="round"
      lineCap="round"
      onClick={() =>
        setSelectedPlotId(prev => (prev === plot.id ? null : plot.id))
      }
      onTap={() =>
        setSelectedPlotId(prev => (prev === plot.id ? null : plot.id))
      }
      onMouseEnter={e => {
        document.body.style.cursor = "pointer";
      }}
      onMouseLeave={e => {
        document.body.style.cursor = "default";
      }}
    />
    <Text
        x={center.x}
        y={center.y}
        text={plot.name}
        fontSize={3} // Scales so it's readable when zooming
        fontFamily="Arial"
        fill={isSelected ? "blue" : "darkgreen"}
        align="center"
        verticalAlign="middle"
        // Offset the text so its center is exactly on the center point
        offsetX={(plot.name.length /2)} 
        listening={false} // Click through the text to hit the plot
      />
      </Group>
  );
})}



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
          const isSelected=  selectedPointKey === p.key;
            return (
              <React.Fragment key={p.key}>
                {/* <Circle
                   x={p.x}
                   y={p.y}
                   // Match the math in your hitFunc
                   radius={3}
                   fill="rgba(255, 0, 0, 0.2)" // Light red area
                   stroke="red"
                   strokeWidth={0.5}
                   listening={false} // Important: so this doesn't block clicks to the real point
                 /> */}
                <Circle
                  x={p.x}
                  y={p.y}
                  radius={POINT_RADIUS}
                  fill={isSelected ? NAVY : BLACK}
                  onClick={() => handlePointClick(p.key)}
                  onTap={() => handlePointClick(p.key)}
                  draggable
                  onDragEnd={(e) => {
                      
                     onPointUpdate(p.key, e.target.x(), e.target.y())
                     console.log('dragged to')
                     console.log(p.key, e.target.x(), e.target.y())
                     
                    }
                  }
                   hitFunc={(ctx, shape) => {
                       const hitRadius = 2; // bigger clickable area, adjusted for zoom
                       ctx.beginPath();
                       ctx.arc(0, 0, hitRadius, 0, Math.PI * 2);
                       ctx.closePath();
                       ctx.fillStrokeShape(shape);
                     }}
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

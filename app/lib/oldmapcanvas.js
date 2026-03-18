// File: /app/component/mapCanvas.js
"use client";
import { Stage, Layer, Circle, Shape, Text, Line, Group } from "react-konva";
import React, { useState, useEffect, useRef } from "react";
import { savePoints, deletePoint, savePlot } from "../lib/actions";

export default function MapCanvas({ points, newpoints, onPointUpdate, onDeletePoint , onReset, onSaveSuccess, plots , updatePlots  }) {
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

const fitMapToScreen = () => {
  if (!stageRef.current || points.length === 0) return;

  const stage = stageRef.current;

  const xs = points.map(p => GetXPixelValue(p.karamX));
  const ys = points.map(p => GetYPixelValue(p.karamY));

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const mapWidth = maxX - minX;
  const mapHeight = maxY - minY;

  const padding = 80;

  const scaleX = (size.width - padding) / mapWidth;
  const scaleY = (size.height - padding) / mapHeight;

  const newScale = Math.min(scaleX, scaleY);

  stage.scale({ x: newScale, y: newScale });

  const posX = size.width / 2 - ((minX + mapWidth / 2) * newScale);
  const posY = size.height / 2 - ((minY + mapHeight / 2) * newScale);

  stage.position({
    x: posX,
    y: posY
  });

  stage.batchDraw();

  setCurrentScale(newScale);
};

useEffect(() => {
  if (points.length > 0) {
    setTimeout(() => {
      fitMapToScreen();
    }, 100);
  }
}, [points, size]);

  const globalMinX = Math.min(...points.map((p) => p.karamX));
  const globalMinY = Math.min(...points.map((p) => p.karamY));
  const scale = 2;
  const offsetx = 50;
  const offsety = 50;

const GetXPixelValue = (value)=>{
     return (value) * scale ;
}
const GetYPixelValue = (value)=>{
     return (value) * scale;
}

const onPixelUpdate = (pointKey, x, y)=>{
    const targetKaramX = (x ) / scale ;
    const targetKaramY = (y ) / scale ;
    onPointUpdate(pointKey,targetKaramX,targetKaramY);
} 




const removeConnectionsForDeletedPoint = (deletedKey) => {
  setConnections(prev =>
    prev.filter(([key1, key2]) => key1 !== deletedKey && key2 !== deletedKey)
  );
};

const calculateArea = (pointKeys) => {
  if (pointKeys.length < 3) return 0;

  // Uses 'points' from the component props directly
  const coords = pointKeys.map(key => points.find(p => p.key === key));
  
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].karamX * coords[j].karamY;
    area -= coords[j].karamX * coords[i].karamY;
  }

  return Math.abs(area) / 2;
};

  // ===== Save points =====
const savePointsToDB = async () => {
  try {
    await savePoints(points);

    if (typeof onSaveSuccess === "function") {
      onSaveSuccess();
    }

    alert("Points saved successfully");
  } catch (err) {
    alert("Failed to save points");
  }
};


const Resetall = () => {
  if (!window.confirm("Discard all unsaved point movements?")) return;

  setConnections([]);
  setSelectedPointKey(null);
  setCreatingPlot(false);
  setCurrentPlotPoints([]);
  setIsPolygonClosed(false);

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
    await deletePoint(point.key);

    removeConnectionsForDeletedPoint(point.key);

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

  const areaValue = calculateArea(currentPlotPoints);

  const plot = {
    id: crypto.randomUUID(),
    name,
    pointKeys: currentPlotPoints,
    area: areaValue.toFixed(2),
  };

  try {

    await savePlot(plot);

    alert(`Plot "${name}" saved! Area: ${areaValue.toFixed(2)} sq. karams`);

    setCurrentPlotPoints([]);
    setSelectedPointKey(null);
    setCreatingPlot(false);
    setIsPolygonClosed(false);
    setConnections([]);

    if (updatePlots) updatePlots(plot);

  } catch (err) {
    console.error(err);
    alert("An error occurred while saving the plot");
  }
};




  //  console.log("current pplot points",currentPlotPoints)
const handlePointClick = (pointKey) => {
  
 console.log("crrent plot points are", currentPlotPoints);

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
      console.log(pointKey);
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
      console.log("running in the end");
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


const fitPlotToScreen = (plot) => {
  if (!stageRef.current || !plot || plot.pointKeys.length === 0) return;

  const stage = stageRef.current;

  // 1️⃣ Get pixel coordinates of all points in the plot
  const xs = plot.pointKeys.map(
    (key) => GetXPixelValue(points.find((p) => p.key === key)?.karamX || 0)
  );
  const ys = plot.pointKeys.map(
    (key) => GetYPixelValue(points.find((p) => p.key === key)?.karamY || 0)
  );

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const plotWidth = maxX - minX;
  const plotHeight = maxY - minY;

  const padding = 60; // px around plot

  // 2️⃣ Calculate new scale to fit plot
  const scaleX = (size.width - padding) / plotWidth;
  const scaleY = (size.height - padding) / plotHeight;
 let newScale = Math.min(scaleX, scaleY);


  //   const MIN_FIT_SCALE = 0.5;
  // const MAX_FIT_SCALE = 4;
  // newScale = Math.max(MIN_FIT_SCALE, Math.min(MAX_FIT_SCALE, newScale));

  // 🔒 Prevent zooming in too close
  const MAX_FIT_SCALE = 4; // Adjust this to control how close it can zoom
   newScale = Math.min(newScale, MAX_FIT_SCALE);


  // 3️⃣ Calculate stage position to center plot
  const centerX = size.width / 2 - ((minX + maxX) / 2) * newScale;
  const centerY = size.height / 2 - ((minY + maxY) / 2) * newScale;

  // 4️⃣ Apply scale and position
  stage.scale({ x: newScale, y: newScale });
  stage.position({ x: centerX, y: centerY });
  stage.batchDraw();

  setCurrentScale(newScale);
};

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.09;
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // 🔒 Zoom limits
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 8;
   newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
// 🔒 Zoom limits

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
   creatingPlot ? "" : setSelectedPointKey(null); // optional but recommended
  }
};


  const getPolygonPoints = (plot) => {
  return plot.pointKeys.flatMap(key => {
    const p = points.find(pt => pt.key === key);
    return p ? [GetXPixelValue(p.karamX), GetYPixelValue(p.karamY)] : [];
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
  onClick={fitMapToScreen}
  style={{
    fontSize: "10px",
    padding: "4px 6px",
    background: "white",
    border: "1px solid black",
    cursor: "pointer",
  }}
>
  FIT MAP
</button>


{selectedPlotId && (
  <button
    onClick={() => {
      const plot = plots.find((p) => p.id === selectedPlotId);
      fitPlotToScreen(plot);
    }}
    style={{
      fontSize: "10px",
      padding: "4px 6px",
      background: "lightgreen",
      border: "1px solid black",
      cursor: "pointer",
    }}
  >
    FIT PLOT
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




{/* {plots.map((plot) => {
  const polygonPoints = getPolygonPoints(plot);
  if (polygonPoints.length < 6) return null;

  const isSelected = selectedPlotId === plot.id;
  const center = getPlotCenter(plot);


  const segments = plot.pointKeys.map((key, index) => {
    const nextKey = plot.pointKeys[(index + 1) % plot.pointKeys.length];
    return [key, nextKey];
  });

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
        onClick={() => setSelectedPlotId((prev) => (prev === plot.id ? null : plot.id))}
        onTap={() => setSelectedPlotId((prev) => (prev === plot.id ? null : plot.id))}
      />

      {segments.map(([k1, k2], idx) => {
        const p1 = points.find((p) => p.key === k1);
        const p2 = points.find((p) => p.key === k2);
        if (!p1 || !p2) return null;

        const x1 = GetXPixelValue(p1.karamX);
        const y1 = GetYPixelValue(p1.karamY);
        const x2 = GetXPixelValue(p2.karamX);
        const y2 = GetYPixelValue(p2.karamY);

        const dx = x2 - x1;
        const dy = y2 - y1;
        let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        if (rotation > 90 || rotation < -90) rotation += 180;

        return (
          <Text
            key={`${plot.id}-dist-${idx}`}
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2}
            text={`${getKaramDistance(k1, k2)} K`}
            fontSize={2}
            fontFamily="monospace"
            fill={isSelected ? "blue" : "darkgreen"}
            rotation={rotation}
            align="center"
            offsetY={2} 
            listening={false}
          />
        );
      })}

  
      <Text
        x={center.x}
        y={center.y}
        text={plot.name}
        fontSize={3}
        fontFamily="Arial"
        fill={isSelected ? "blue" : "darkgreen"}
        align="center"
        verticalAlign="middle"
        offsetX={plot.name.length / 2}
        listening={false}
      />
    </Group>
  );
})} */}

{plots.map((plot) => {
  const polygonPoints = getPolygonPoints(plot);
  if (polygonPoints.length < 6) return null;

  const isSelected = selectedPlotId === plot.id;
  const center = getPlotCenter(plot);

  return (
    <Shape
    onDblClick={() => fitPlotToScreen(plot)}
      key={plot.id}
      // Visual Properties
      fill={isSelected ? "rgba(0,0,255,0.25)" : "rgba(0,128,0,0.15)"}
      stroke={isSelected ? "blue" : "green"}
      strokeWidth={0.5}
      // Click Logic (Now applies to the entire drawn shape)
      onClick={() => setSelectedPlotId((prev) => (prev === plot.id ? null : plot.id))}
      onTap={() => setSelectedPlotId((prev) => (prev === plot.id ? null : plot.id))}
      // Drawing Logic
      sceneFunc={(context, shape) => {
        // 1. DRAW POLYGON PATH
        context.beginPath();
        context.moveTo(polygonPoints[0], polygonPoints[1]);
        for (let i = 2; i < polygonPoints.length; i += 2) {
          context.lineTo(polygonPoints[i], polygonPoints[i + 1]);
        }
        context.closePath();
        
        // This helper fills and strokes the path using the props above
        context.fillStrokeShape(shape);

        // 2. DRAW DISTANCE LABELS (Manual Canvas Text)
        context.font = "2px monospace";
        context.fillStyle = isSelected ? "blue" : "darkgreen";
        context.textAlign = "center";

        plot.pointKeys.forEach((key, index) => {
          const nextKey = plot.pointKeys[(index + 1) % plot.pointKeys.length];
          const p1 = points.find((p) => p.key === key);
          const p2 = points.find((p) => p.key === nextKey);
          
          if (p1 && p2) {
            const x1 = GetXPixelValue(p1.karamX);
            const y1 = GetYPixelValue(p1.karamY);
            const x2 = GetXPixelValue(p2.karamX);
            const y2 = GetYPixelValue(p2.karamY);

            context.save(); // Save state for rotation
            context.translate((x1 + x2) / 2, (y1 + y2) / 2);
            
            let rotation = Math.atan2(y2 - y1, x2 - x1);
            if (rotation > Math.PI / 2 || rotation < -Math.PI / 2) rotation += Math.PI;
            
            context.rotate(rotation);
            context.fillText(`${getKaramDistance(key, nextKey)} K`, 0, -0.3);
            context.restore(); // Restore state
          }
        });

        // 3. DRAW PLOT NAME
        context.font = "3px Arial";
        context.fillText(plot.name, center.x, center.y);
        context.fillText(plot.area, center.x, center.y + 3);
      }}
    />
  );
})}






          {/* ===== Lines ===== */}
 {connections.map((conn) => {
  const p1 = points.find(p => p.key === conn[0]);
  const p2 = points.find(p => p.key === conn[1]);
  
  if (!p1 || !p2) return null; // safety check in case points are deleted
 const x1 = GetXPixelValue(p1.karamX);
const y1 = GetYPixelValue(p1.karamY);
const x2 = GetXPixelValue(p2.karamX);
const y2 = GetYPixelValue(p2.karamY);
  const lineKey = `${conn[0]}-${conn[1]}`;
  const isHovered = hoveredLineKey === lineKey;

  const dx = x2 - x1;
  const dy = y2 - y1;
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
      {/* <Line points={[x1, y1, x2, y2]} stroke="transparent" strokeWidth={0.5} /> */}
      <Line points={[x1, y1, x2, y2]} stroke={creatingPlot ? NAVY : BLACK} strokeWidth={STROKE_WIDTH} />
      { (
        <Text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2}
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

{/* ===== Temporary Area Display during Creation ===== */}
{creatingPlot && isPolygonClosed && currentPlotPoints.length >= 3 && (() => {
  // 1. Get the pixel coordinates for all points in the current plot

  const polygonPoints = currentPlotPoints.flatMap(key => {
    const p = points.find(pt => pt.key === key);
    return p ? [GetXPixelValue(p.karamX), GetYPixelValue(p.karamY)] : [];
  });


  

  // 2. Calculate the center of the shape to place the text
  let totalX = 0, totalY = 0;
  for (let i = 0; i < polygonPoints.length; i += 2) {
    totalX += polygonPoints[i];
    totalY += polygonPoints[i + 1];
  }
  const centerX = totalX / (polygonPoints.length / 2);
  const centerY = totalY / (polygonPoints.length / 2);

  // 3. Calculate the actual area
  const currentArea = calculateArea(currentPlotPoints).toFixed(2);

  return (
    <Group listening={false}>
      {/* Visual Fill to show the user the area is closed */}
      <Line
        points={polygonPoints}
        closed
        fill="rgba(0, 0, 255, 0.1)"
        stroke="blue"
        strokeWidth={0.5}
        dash={[1, 1]}
      />
      {/* The Area Text */}
      <Text
        x={centerX}
        y={centerY}
        text={`Preview Area:\n${currentArea} K`}
        fontSize={2.5}
        fontFamily="Arial"
        fill="blue"
        align="center"
        offsetX={5} // Adjust based on text width
      />
    </Group>
  );
})()}

          {/* ===== Points ===== */}


        
{points.map((p) => {
  const isSelected = selectedPointKey === p.key;
  const isNew = newpoints.some(np => np.key === p.key);
  return (
    <Shape
      key={p.key}
      x={GetXPixelValue(p.karamX)}
      y={GetYPixelValue(p.karamY)}
      draggable
      // sceneFunc handles the actual drawing on the canvas
      sceneFunc={(context, shape) => {
        // 1. Draw the Circle
        context.beginPath();
        context.arc(0, 0, POINT_RADIUS, 0, Math.PI * 2, false);
       context.closePath();
       let color = BLACK;
        if (isNew) color = "red";
        if (isSelected) color = NAVY;
        context.fillStyle = color;
          context.fill();

        // 2. Draw the Text
        context.font = "3px monospace";

        context.fillStyle = color;
        context.textAlign = "center";
        context.textBaseline = "middle";
        // Offsets (-2, -3) from your original code
        context.fillText(p.name.toUpperCase(), 0, -1.5);
         context.fillStrokeShape(shape);
      }}
      // hitFunc defines the interactive area
      hitFunc={(ctx, shape) => {
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      }}
      onClick={() => handlePointClick(p.key)}
      onTap={() => handlePointClick(p.key)}
      onDragEnd={(e) => {
        onPixelUpdate(p.key, e.target.x(), e.target.y());
        console.log('dragged to', p.key, e.target.x(), e.target.y());
      }}
    />
  );
})}



          
        </Layer>
      </Stage>
    </div>
  );
}

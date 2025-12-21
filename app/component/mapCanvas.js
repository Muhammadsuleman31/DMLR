"use client";
import { Stage, Layer, Circle, Text } from "react-konva";
import React, { useState, useEffect } from "react";

export default function MapCanvas({ points, onPointUpdate }) {
  // 1. Dynamic Stage Size (Fills the screen)
  const [size, setSize] = useState({ width: 1000, height: 800 });

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight - 150 });
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 2. Zoom Logic (Handle Mouse Wheel)
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.1; // Zoom speed
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    // This math ensures we zoom into the mouse position, not the corner
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  };

  return (
    <Stage 
      width={size.width} 
      height={size.height} 
      draggable // This allows you to "walk" around the city
      onWheel={handleWheel} // This allows you to zoom in/out
    >
      <Layer>
        {points.map((p) => (
          <React.Fragment key={`${p.name}-${p.time}`}>
            <Circle
              x={p.x}
              y={p.y}
              radius={1 / (points.length > 1000 ? 2 : 1)} // Adjust dot size based on density
              fill="red"
              draggable
              onDragEnd={(e) =>
                onPointUpdate(
                  points.findIndex(pt => pt.name === p.name && pt.time === p.time),
                  e.target.x(),
                  e.target.y()
                )
              }
            />
            {/* Only show text if zoomed in or for specific points to avoid clutter */}
            <Text x={p.x + 2} y={p.y + 2} text={p.name} fontSize={5} />
          </React.Fragment>
        ))}
      </Layer>
    </Stage>
  );
}
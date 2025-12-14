"use client";

import { Stage, Layer, Circle, Text } from "react-konva";
import React from "react";

export default function MapCanvas({ points, onPointUpdate }) {
  return (
    <Stage width={800} height={600} draggable>
      <Layer>
        {points.map((p) => (
          <React.Fragment key={`${p.name}-${p.time}`}>
            <Circle
              x={p.x}
              y={p.y}
              radius={6}
              fill="red"
              draggable
              onDragEnd={(e) =>
                onPointUpdate(
                  points.findIndex(
                    pt => pt.name === p.name && pt.time === p.time
                  ),
                  e.target.x(),
                  e.target.y()
                )
              }
            />
            <Text
              x={p.x + 8}
              y={p.y + 8}
              text={p.name}
              fontSize={10}
            />
          </React.Fragment>
        ))}
      </Layer>
    </Stage>
  );
}

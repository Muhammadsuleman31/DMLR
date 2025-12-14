const pointTable = [];

export function insertPoints(newPoints) {
  newPoints.forEach((p) => {
    const exists = pointTable.find(
      (row) => row.name === p.name && row.time === p.time
    );

    if (!exists) {
      pointTable.push(p);
    }
  });

  return pointTable;
}

export function getAllPoints() {
  return pointTable;
}

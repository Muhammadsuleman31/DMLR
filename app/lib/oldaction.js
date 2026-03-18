"use server";
import fs from "fs";
import path from "path";
const DATA_DIR = path.join(process.cwd(), "data");
const POINTS_FILE = path.join(DATA_DIR, "points.json");
const PLOTS_FILE = path.join(DATA_DIR, "plots.json");

// GET POINTS
export async function getPoints() {
try {
if (!fs.existsSync(POINTS_FILE)) {
return [];
}
const raw = fs.readFileSync(POINTS_FILE, "utf8");
return JSON.parse(raw);
} catch (err) {
console.error(err);
throw new Error(err.message);
}
}

// SAVE POINTS
export async function savePoints(points) {
try {
if (!fs.existsSync(DATA_DIR)) {
fs.mkdirSync(DATA_DIR);
}
let existing = [];

if (fs.existsSync(POINTS_FILE)) {
  existing = JSON.parse(fs.readFileSync(POINTS_FILE, "utf8"));
}

// prevent duplicates by key
const map = new Map(existing.map(p => [p.key, p]));
points.forEach(p => map.set(p.key, p));

fs.writeFileSync(
  POINTS_FILE,
  JSON.stringify([...map.values()], null, 2)
);

return { success: true };
} catch (err) {
console.error(err);
throw new Error(err.message);
}
}

// DELETE POINT
export async function deletePoint(key) {
try {
if (!key) {
throw new Error("Key is required");
}
const fileData = fs.readFileSync(POINTS_FILE, "utf-8");
const points = JSON.parse(fileData);

const filteredPoints = points.filter(p => p.key !== key);

fs.writeFileSync(
  POINTS_FILE,
  JSON.stringify(filteredPoints, null, 2)
);

return { success: true };
} catch (err) {
console.error(err);
throw new Error("Failed to delete point");
}
}

// SAVE PLOT
export async function savePlot({ id, name, pointKeys, area }) {
try {
if (!id || !name || !Array.isArray(pointKeys) || pointKeys.length === 0) {
throw new Error("Invalid data");
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

let existing = [];

if (fs.existsSync(PLOTS_FILE)) {
  existing = JSON.parse(fs.readFileSync(PLOTS_FILE, "utf8"));
}

// Prevent duplicates by id
const filtered = existing.filter(p => p.id !== id);

filtered.push({ id, name, pointKeys, area });

fs.writeFileSync(
  PLOTS_FILE,
  JSON.stringify(filtered, null, 2)
);

return { success: true };
} catch (err) {
console.error(err);
throw new Error(err.message);
}
}

// GET PLOTSA
export async function getPlots() {
try {
if (!fs.existsSync(PLOTS_FILE)) {
return [];
}
const raw = fs.readFileSync(PLOTS_FILE, "utf8");
return JSON.parse(raw);
} catch (err) {
console.error(err);
throw new Error(err.message);
}
}
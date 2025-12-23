// File: /app/api/delete-point/route.js
import fs from "fs";
import path from "path";

const POINTS_FILE = path.join(process.cwd(), "data/points.json");

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key) {
      return new Response(JSON.stringify({ error: "Key is required" }), { status: 400 });
    }

    // Read existing points
    const fileData = fs.readFileSync(POINTS_FILE, "utf-8");
    const points = JSON.parse(fileData);

    // Filter out the point to delete
    const filteredPoints = points.filter(p => p.key !== key);

    // Write back the updated points
    fs.writeFileSync(POINTS_FILE, JSON.stringify(filteredPoints, null, 2));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to delete point" }), { status: 500 });
  }
}

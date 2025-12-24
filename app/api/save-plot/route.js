import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "plots.json");

export async function POST(req) {
  try {
    const { id, name, pointKeys } = await req.json(); // <-- accept id from frontend

    if (!id || !name || !Array.isArray(pointKeys) || pointKeys.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400 });
    }

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR);
    }

    // Load existing plots
    let existing = [];
    if (fs.existsSync(FILE_PATH)) {
      existing = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    // Prevent duplicates by plot id (or name if you prefer)
    const filtered = existing.filter(p => p.id !== id);

    // Add new plot using frontend id
    filtered.push({ id, name, pointKeys });

    // Save
    fs.writeFileSync(FILE_PATH, JSON.stringify(filtered, null, 2));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const data = JSON.parse(raw);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

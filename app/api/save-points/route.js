import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "points.json");

export async function GET() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const data = JSON.parse(raw);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { points } = await req.json();

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR);
    }

    let existing = [];

    if (fs.existsSync(FILE_PATH)) {
      existing = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    // prevent duplicates by key
    const map = new Map(existing.map(p => [p.key, p]));
    points.forEach(p => map.set(p.key, p));

    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify([...map.values()], null, 2)
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}

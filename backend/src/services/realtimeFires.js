// services/realtimeFires.js
import axios from "axios";

const { FIRMS_KEY } = process.env;

export async function getRealtimeFires() {
  try {
    // adjust latitude/longitude/distance if needed
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/?latitude=28.6&longitude=77.2&distance=50&key=${FIRMS_KEY}`;
    const resp = await axios.get(url);

    // crude: each line = one fire record (header + rows)
    const lines = resp.data.split("\n").filter(l => l.trim().length > 0);
    const fire_count = Math.max(lines.length - 1, 0); // minus header

    return { fire_count };
  } catch (err) {
    console.error("FIRMS error:", err.message);
    return { fire_count: 0 };
  }
}

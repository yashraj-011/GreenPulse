// scripts/testAqicnBounds.mjs
import axios from "axios";
import dotenv from "dotenv";
import { sanitizeAndAggregateAqi } from "../utils/aqicnSanitize.js";

dotenv.config();

const { AQICN_TOKEN } = process.env;
if (!AQICN_TOKEN) {
  console.error("Set AQICN_TOKEN in .env");
  process.exit(1);
}

const boundsUrl = `https://api.waqi.info/map/bounds/?token=${AQICN_TOKEN}&latlng=28.40,76.80,28.90,77.40`;

(async () => {
  try {
    const resp = await axios.get(boundsUrl);
    const agg = sanitizeAndAggregateAqi(resp.data.data, { staleMinutes: 90, outlierTrimPercent: 0.05 });
    console.log("Delhi agg:", JSON.stringify(agg, null, 2));
  } catch (err) {
    console.error("Error fetching AQICN bounds:", err.message);
  }
})();

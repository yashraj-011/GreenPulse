// services/featureSchema.js
import axios from "axios";

const { FASTAPI_URL } = process.env;

let cachedFeatures = null;

export async function getFeatureNames() {
  if (cachedFeatures) return cachedFeatures;

  try {
    console.log("🔍 Fetching feature schema from FastAPI:", `${FASTAPI_URL}/features`);
    const resp = await axios.get(`${FASTAPI_URL}/features`, {
      timeout: 5000 // 5 second timeout
    });

    cachedFeatures = resp.data.features;
    console.log("✅ Loaded feature schema from FastAPI:", cachedFeatures.length, "features");
    return cachedFeatures;
  } catch (error) {
    console.warn("⚠️ Failed to fetch features from FastAPI:", error.message);
    console.log("🔄 Will use fallback feature list in buildFeatureVector");

    // Don't cache the failure, so we retry next time
    throw error; // Let Promise.allSettled handle this gracefully
  }
}

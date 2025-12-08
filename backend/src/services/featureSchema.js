// services/featureSchema.js
import axios from "axios";

const { FASTAPI_URL } = process.env;

let cachedFeatures = null;

export async function getFeatureNames() {
  if (cachedFeatures) return cachedFeatures;

  const resp = await axios.get(`${FASTAPI_URL}/features`);
  cachedFeatures = resp.data.features;
  console.log("✅ Loaded feature schema from FastAPI:", cachedFeatures.length, "features");
  return cachedFeatures;
}

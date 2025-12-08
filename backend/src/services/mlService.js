import axios from "axios";

const ML_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function getForecastFromML(features) {
  const resp = await axios.post(`${ML_URL}/predict`, { data: features });
  return resp.data;
}

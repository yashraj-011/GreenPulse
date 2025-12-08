// src/api/utils/healthEngine.js

export function buildHealthAdvice(aqi) {
  const value = Number(aqi || 0);

  let level = "Good";
  let color = "#22c55e";
  let message = "Air quality is good. Enjoy outdoor activities.";
  let mask = "Mask not required.";
  let outdoorIndex = 10; // 0–10

  if (value > 50 && value <= 100) {
    level = "Satisfactory";
    color = "#84cc16";
    message = "Generally acceptable. Sensitive groups should be cautious.";
    mask = "Mask optional for sensitive groups.";
    outdoorIndex = 8;
  } else if (value > 100 && value <= 200) {
    level = "Moderate";
    color = "#eab308";
    message =
      "Pollution can affect breathing. Avoid long or intense outdoor exposure.";
    mask = "Consider a mask during heavy traffic or jogging.";
    outdoorIndex = 6;
  } else if (value > 200 && value <= 300) {
    level = "Poor";
    color = "#f97316";
    message =
      "Unhealthy air. Avoid outdoor exercise and prefer indoor activities.";
    mask = "N95 mask recommended outside.";
    outdoorIndex = 3;
  } else if (value > 300 && value <= 400) {
    level = "Very Poor";
    color = "#ef4444";
    message =
      "Very unhealthy. Elderly, kids & heart patients should stay indoors.";
    mask = "N95 + air purifier advised.";
    outdoorIndex = 1;
  } else if (value > 400) {
    level = "Severe";
    color = "#7f1d1d";
    message = "Severe emergency level pollution.";
    mask = "Avoid going outside unless absolutely necessary.";
    outdoorIndex = 0;
  }

  return { level, color, message, mask, outdoorIndex };
}

// src/components/ForecastChart.jsx
import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ForecastChart = ({ data = [], range = "72" }) => {
  // Data shape expected: [{ hour: "Now", aqi: 200 }, ...]

  // Filter data based on selected range
  const getFilteredData = () => {
    if (!data || !Array.isArray(data)) return [];

    const rangeHours = parseInt(range);

    // Always include "Now" data point
    const filteredData = [data[0]]; // "Now"

    // Add intermediate points and target range point
    if (rangeHours >= 24) {
      // Add 6h, 12h, 24h
      if (data[1]) filteredData.push(data[1]); // +6h
      if (data[2]) filteredData.push(data[2]); // +12h
      if (data[3]) filteredData.push(data[3]); // +24h
    }

    if (rangeHours >= 48) {
      // Add 48h
      if (data[4]) filteredData.push(data[4]); // +48h
    }

    if (rangeHours >= 72) {
      // Add 72h
      if (data[5]) filteredData.push(data[5]); // +72h
    }

    return filteredData;
  };

  const chartData = getFilteredData();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="aqi" stroke="#2563EB" fill="#BFDBFE" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart;

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

  // Check if we're in dark mode by looking at the document's classList
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Dynamic colors based on theme
  const chartColors = {
    stroke: isDarkMode ? "#60A5FA" : "#2563EB", // blue-400 in dark, blue-600 in light
    fill: isDarkMode ? "#1E40AF" : "#BFDBFE", // blue-700 in dark, blue-200 in light
    text: isDarkMode ? "#E2E8F0" : "#374151", // slate-200 in dark, gray-700 in light
    grid: isDarkMode ? "#475569" : "#E5E7EB" // slate-600 in dark, gray-200 in light
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: chartColors.text }}
          axisLine={{ stroke: chartColors.grid }}
          tickLine={{ stroke: chartColors.grid }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: chartColors.text }}
          axisLine={{ stroke: chartColors.grid }}
          tickLine={{ stroke: chartColors.grid }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
            borderRadius: '8px',
            color: chartColors.text
          }}
        />
        <Area
          type="monotone"
          dataKey="aqi"
          stroke={chartColors.stroke}
          fill={chartColors.fill}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart;

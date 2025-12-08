// src/components/ForecastChart.jsx
import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ForecastChart = ({ data = [] }) => {
  // Data shape expected: [{ hour: "Now", aqi: 200 }, ...]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="aqi" stroke="#2563EB" fill="#BFDBFE" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart;

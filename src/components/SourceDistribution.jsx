// src/components/SourceDistribution.jsx
import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { aqiService } from "../services/aqiService";

const COLORS = ["#EF4444", "#F59E0B", "#6366F1", "#10B981", "#94A3B8"]; // red, amber, indigo, green, gray

export default function SourceDistribution({ data: propData, selectedStation }) {
  const [data, setData] = useState(propData || []);

  useEffect(() => {
    let mounted = true;

    if (propData && propData.length) {
      setData(propData);
      return;
    }

    (async () => {
      try {
        if (aqiService && typeof aqiService.getSources === "function") {
          // Use selected station name if available, otherwise fallback
          const stationName = selectedStation?.name || "Delhi Central";
          const resp = await aqiService.getSources(stationName);
          if (!mounted) return;
          if (Array.isArray(resp) && resp.length) {
            setData(resp);
            return;
          }
        }
      } catch (e) {
        // ignore and fall back
      }

      if (!mounted) return;
      // fallback demo data
      setData([
        { name: "Traffic", value: 35 },
        { name: "Stubble", value: 25 },
        { name: "Industry", value: 20 },
        { name: "Dust", value: 15 },
        { name: "Others", value: 5 }
      ]);
    })();

    return () => {
      mounted = false;
    };
  }, [propData, selectedStation]);

  if (!data || !data.length) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-2 dark:text-slate-50">Pollution Sources (Estimated)</h3>
        {selectedStation && (
          <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">
            For: {selectedStation.name}
          </p>
        )}
        <div className="text-sm text-slate-500 dark:text-slate-300">No sources data available for this station</div>
      </div>
    );
  }

  // compute top slice (largest value) for center label
  const top = data.reduce(
    (acc, cur) => (cur.value > (acc?.value ?? -Infinity) ? cur : acc),
    null
  );

  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        {/* Left: fixed-size pie wrapper so Recharts measures properly */}
        <div style={{ width: 180, minWidth: 180, position: "relative" }}>
          <div style={{ width: "100%", height: 180, position: "relative" }}>
            {/* Center label placed absolutely above the SVG for precise centering */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={64}
                  paddingAngle={4}
                  cornerRadius={6}
                  // no label per-slice (we render a single centered label)
                  label={false}
                  isAnimationActive={false}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>

            {/* Overlay center label */}
            {top && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  textAlign: "center"
                }}
              >
                <div className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {top.value}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                  {top.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: legend / details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-2 dark:text-slate-50">
            Pollution Sources (Estimated)
            {selectedStation && (
              <span className="block text-xs font-normal text-slate-500 dark:text-slate-300 mt-1">
                For: {selectedStation.name}
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 gap-2 text-sm">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      background: COLORS[i % COLORS.length],
                      borderRadius: 6,
                      display: "inline-block",
                      boxShadow: "0 0 0 2px rgba(0,0,0,0.03)"
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-50">{d.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-400">Share</div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{d.value}%</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-400 mt-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Demo data - Connect to real API for live sources breakdown
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

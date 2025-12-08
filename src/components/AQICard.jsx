// src/components/AQICard.jsx
import React, { useState } from "react";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function aqiStatus(aqi) {
  if (aqi == null) return { label: "Unknown", color: "#94A3B8", text: "—" };
  if (aqi <= 50) return { label: "Good", color: "#16a34a", text: "Good" };
  if (aqi <= 100) return { label: "Moderate", color: "#f59e0b", text: "Moderate" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#f97316", text: "Unhealthy" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#ef4444", text: "Very Unhealthy" };
  return { label: "Hazardous", color: "#7e22ce", text: "Hazardous" };
}

export default function AQICard({ station, onSearch, suggestions = [], loading = false }) {
  const [query, setQuery] = useState("");

  const aqi = station && typeof station.aqi === "number" ? station.aqi : (station && parseInt(station.aqi, 10)) || 0;
  const pct = clamp((Math.min(aqi, 500) / 500) * 100, 0, 100);

  const size = 160;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const dashOffset = circumference - dash;

  const status = aqiStatus(aqi);

  const handleSearch = (e) => {
    e.preventDefault();
    if (typeof onSearch === "function") onSearch(query.trim());
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-6">
        {/* Gauge */}
        <div style={{ width: size }} className="flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={radius} stroke="#EFF6FF" strokeWidth={stroke} fill="none" strokeLinecap="round" />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={status.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.9,.2,1), stroke 300ms" }}
            />
            <circle cx={cx} cy={cy} r={radius - stroke - 4} fill="#ffffff" />
            <g>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="700" fill="#0f172a">
                {aqi}
              </text>
              <text x={cx} y={cy + 20} textAnchor="middle" fontSize="12" fill="#475569">
                {status.label}
              </text>
            </g>
          </svg>
        </div>

        {/* Details + Search */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500">Current AQI</p>
              <h3 className="text-lg font-semibold text-slate-900 leading-tight">{station?.name || "—"}</h3>
              <p className="text-[12px] text-slate-500 mt-1">{station?.category || ""}</p>
            </div>

            {/* Search input (small) */}
            <div style={{ minWidth: 220 }} className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  list={suggestions && suggestions.length ? "delhi-suggestions" : undefined}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search location (Delhi)"
                  className="input px-3 py-2 w-52"
                  aria-label="Search location"
                />
                <button type="submit" className="btn-primary px-3 py-2">
                  Find
                </button>
                {suggestions && suggestions.length ? (
                  <datalist id="delhi-suggestions">
                    {suggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                ) : null}
              </form>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500">Category</div>
              <div className="font-semibold text-slate-800 mt-1">{station?.category || "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500">Last updated</div>
              <div className="font-semibold text-slate-800 mt-1">Just now</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

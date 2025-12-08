// src/pages/SafeRoutes.jsx
import React, { useEffect, useState } from "react";
import { MapPin, Route as RouteIcon, ArrowRight, AlertTriangle } from "lucide-react";
import SafeRouteMap from "../components/SafeRouteMap";

const baseRoute = {
  fromName: "Noida Sector 62",
  toName: "Connaught Place",
  from: { lat: 28.6289, lng: 77.3649 },
  to: { lat: 28.6315, lng: 77.2167 },
  distanceKm: 21.4,
  durationMin: 48,
  avgAQI: 165,
  maxAQI: 210,
  altSavedPercent: 28
};

export default function SafeRoutes() {
  const [form, setForm] = useState({ from: baseRoute.fromName, to: baseRoute.toName });
  const [route, setRoute] = useState(baseRoute);

  // holds per-route computed summaries from SafeRouteMap
  const [routesData, setRoutesData] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);

  useEffect(() => {
    setRoute(baseRoute);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setRoute((prev) => ({ ...prev, fromName: form.from || prev.fromName, toName: form.to || prev.toName }));
    // reset selected index to let SafeRouteMap auto-pick the least-AQI route
    setSelectedRouteIndex(null);
  };

  const handleRoutesData = (data) => {
    setRoutesData(data || []);
    // if parent hasn't chosen anything, we can decide to highlight best route in parent UI as well
    if (!selectedRouteIndex && data && data.length) {
      // find index of least avgAQI to highlight visually
      let minIdx = 0;
      let minVal = data[0].avgAQI;
      for (let i = 1; i < data.length; i++) {
        if (data[i].avgAQI < minVal) {
          minVal = data[i].avgAQI;
          minIdx = i;
        }
      }
      setSelectedRouteIndex(minIdx);
    }
  };

  const handleSelectRoute = (idx) => {
    setSelectedRouteIndex(idx);
  };

  const getAQIBadgeClass = (aqi) => {
    if (aqi <= 50) return "bg-green-100 text-green-700";
    if (aqi <= 100) return "bg-yellow-100 text-yellow-700";
    if (aqi <= 200) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Safe Route Suggestion</h1>
      <p className="text-sm text-slate-500">Find routes that minimize your exposure to poor air quality.</p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* left column: form + alternatives */}
        <div className="lg:col-span-2 card space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">Plan your trip</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-slate-600">From</label>
              <input className="input mt-1" name="from" value={form.from} onChange={handleChange} placeholder="Start location" />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">To</label>
              <input className="input mt-1" name="to" value={form.to} onChange={handleChange} placeholder="Destination" />
            </div>

            <button className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              <RouteIcon size={16} />
              <span>Find Safest Route</span>
            </button>
          </form>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary-600" />
                <div>
                  <p className="font-semibold text-slate-800">
                    {route.fromName} <ArrowRight className="inline mx-1" size={12} /> {route.toName}
                  </p>
                  <p className="text-[11px] text-slate-500">Note: using demo coordinates for routing</p>
                </div>
              </div>
              <span className={`badge ${getAQIBadgeClass(route.avgAQI)}`}>Avg AQI {route.avgAQI}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
              <div>
                <p className="uppercase tracking-wide text-[10px]">Distance</p>
                <p className="text-sm font-semibold text-slate-900">{route.distanceKm} km</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px]">ETA</p>
                <p className="text-sm font-semibold text-slate-900">{route.durationMin} min</p>
              </div>
            </div>
          </div>

          {/* Alternatives list (rendered from routesData emitted by the map) */}
          <div>
            <h3 className="text-sm font-semibold mt-4 mb-2">Alternatives</h3>
            {routesData && routesData.length ? (
              <div className="space-y-2">
                {routesData.map((r, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${selectedRouteIndex === i ? "border-primary-600 bg-primary-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.summary || `Route ${i + 1}`}</div>
                        <div className="text-xs text-slate-500 mt-1">{r.distanceText || ""} · {r.durationText || ""}{r.durationTrafficText ? ` · ⏱ ${r.durationTrafficText}` : ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{r.avgAQI}</div>
                        <div className="text-xs text-slate-500">avg AQI</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setSelectedRouteIndex(i)} className="px-3 py-1 rounded bg-slate-100 text-sm">Preview</button>
                      <button onClick={() => { setSelectedRouteIndex(i); }} className="px-3 py-1 rounded bg-primary-600 text-white text-sm">Select</button>
                      <div className="ml-auto text-xs" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, background: aqiHex(r.maxAQI), display: "inline-block", borderRadius: 6 }} title={`max AQI ${r.maxAQI}`} />
                        <span className="text-slate-500">{r.maxAQI ? `max ${r.maxAQI}` : ""}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md p-3 bg-white border border-slate-200 text-sm text-slate-500">No alternatives yet — the map will list alternatives once directions load.</div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={() => setRoute(baseRoute)} className="px-3 py-2 rounded bg-slate-100 text-sm">Use demo route (force)</button>
          </div>
        </div>

        {/* right column: map */}
        <div className="lg:col-span-3 card h-[420px] p-0 overflow-hidden">
          <SafeRouteMap
            route={route}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={handleSelectRoute}
            onRoutesData={handleRoutesData}
          />
        </div>
      </div>
    </div>
  );
}

// src/pages/SafeRoutes.jsx
import React, { useEffect, useState } from "react";
import { MapPin, Route as RouteIcon, ArrowRight, AlertTriangle, Loader } from "lucide-react";
import SafeRouteMap from "../components/SafeRouteMap";
import { geocodeService } from "../services/geocodeService";

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
  const [loading, setLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);

  // holds per-route computed summaries from SafeRouteMap
  const [routesData, setRoutesData] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);

  useEffect(() => {
    setRoute(baseRoute);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeocodeError(null);

    try {
      // Geocode both locations
      console.log(`🔍 Geocoding: "${form.from}" and "${form.to}"`);

      const [fromCoords, toCoords] = await Promise.all([
        geocodeService.geocode(form.from),
        geocodeService.geocode(form.to)
      ]);

      if (!fromCoords) {
        setGeocodeError(`Could not find location: "${form.from}"`);
        return;
      }

      if (!toCoords) {
        setGeocodeError(`Could not find location: "${form.to}"`);
        return;
      }

      console.log('✅ Geocoded successfully:', { fromCoords, toCoords });

      // Update route with real coordinates
      setRoute({
        ...route,
        fromName: fromCoords.formattedAddress || form.from,
        toName: toCoords.formattedAddress || form.to,
        from: { lat: fromCoords.lat, lng: fromCoords.lng },
        to: { lat: toCoords.lat, lng: toCoords.lng }
      });

      // reset selected index to let SafeRouteMap auto-pick the least-AQI route
      setSelectedRouteIndex(null);

    } catch (error) {
      console.error('Geocoding failed:', error);
      setGeocodeError('Failed to find locations. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
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
    if (aqi <= 50) return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    if (aqi <= 100) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
    if (aqi <= 200) return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
  };

  const useDemoRoute = () => {
    setRoute(baseRoute);
    setForm({ from: baseRoute.fromName, to: baseRoute.toName });
    setGeocodeError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Safe Route Finder</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          Find routes that minimize your exposure to poor air quality across Delhi-NCR
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* left column: form + alternatives */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-50 mb-4">Plan your trip</h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">From</label>
                <input
                  className="input px-3 py-2 w-full"
                  name="from"
                  value={form.from}
                  onChange={handleChange}
                  placeholder="Enter starting location (e.g., Connaught Place)"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">To</label>
                <input
                  className="input px-3 py-2 w-full"
                  name="to"
                  value={form.to}
                  onChange={handleChange}
                  placeholder="Enter destination (e.g., India Gate)"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.from.trim() || !form.to.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Finding Routes...</span>
                  </>
                ) : (
                  <>
                    <RouteIcon size={16} />
                    <span>Find Safest Route</span>
                  </>
                )}
              </button>
            </form>

            {geocodeError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{geocodeError}</p>
                </div>
                <button
                  onClick={useDemoRoute}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  Use demo route instead
                </button>
              </div>
            )}

            {!geocodeError && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-green-600 dark:text-green-400" />
                  <p className="font-medium text-green-900 dark:text-green-100">Current Route</p>
                </div>
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium mb-1">
                    {route.fromName} <ArrowRight className="inline mx-1" size={12} /> {route.toName}
                  </p>
                  {route.from.lat !== baseRoute.from.lat && (
                    <p className="text-xs text-green-600 dark:text-green-300">
                      ✅ Using real coordinates from Google Maps
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alternatives list */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-50 mb-3">Route Options</h3>
            {routesData && routesData.length ? (
              <div className="space-y-3">
                {routesData.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRouteIndex === i
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                        : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => handleSelectRoute(i)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 dark:text-slate-50">{r.summary || `Route ${i + 1}`}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {r.distanceText || ""} • {r.durationText || ""}
                          {r.durationTrafficText && ` • Traffic: ${r.durationTrafficText}`}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-50">{r.avgAQI}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">avg AQI</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAQIBadgeClass(r.avgAQI)}`}>
                        {r.avgAQI <= 50 ? 'Clean Route' : r.avgAQI <= 100 ? 'Moderate' : r.avgAQI <= 200 ? 'Polluted' : 'High Pollution'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: aqiHex(r.maxAQI) }}
                          title={`Max AQI: ${r.maxAQI}`}
                        />
                        <span>max {r.maxAQI}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                <RouteIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Enter locations and search to see route options</p>
              </div>
            )}
          </div>

          {/* Demo route button */}
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-50 mb-2">Demo</h4>
            <button
              onClick={useDemoRoute}
              className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              Load demo route (Noida → CP)
            </button>
          </div>
        </div>

        {/* right column: map */}
        <div className="lg:col-span-3 card h-[500px] p-0 overflow-hidden">
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

// Helper function (make available globally for the component)
function aqiHex(aqi) {
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#f59e0b";
  if (aqi <= 200) return "#f97316";
  return "#ef4444";
}

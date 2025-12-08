// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { aqiService } from "../services/aqiService";
import AQICard from "../components/AQICard";
import ForecastChart from "../components/ForecastChart";
import SourceDistribution from "../components/SourceDistribution";
import DelhiAQIMap from "../components/DelhiAQIMap";

const DEFAULT_RANGE = "72";

export default function Dashboard() {
  const [stations, setStations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [sourcesData, setSourcesData] = useState(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [stationSuggestions, setStationSuggestions] = useState([]);

  // Auto-refresh function
  const refreshStationsData = async () => {
    try {
      console.log('🔄 Auto-refreshing stations data...');
      const data = (await aqiService.getStations()) || [];
      setStations(data);

      // Update suggestions
      const suggestions = data.map(station => station.name).slice(0, 16);
      setStationSuggestions(suggestions);

      // Update selected station if it exists
      if (selected && !selected.isVirtual) {
        const updatedSelected = data.find(s => s.id === selected.id);
        if (updatedSelected) {
          setSelected(updatedSelected);
        }
      }

      console.log('✅ Stations data refreshed successfully');
    } catch (e) {
      console.warn('❌ Failed to refresh stations data', e);
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingStations(true);
      try {
        const data = (await aqiService.getStations()) || [];
        setStations(data);

        // Extract station names for search suggestions
        const suggestions = data.map(station => station.name).slice(0, 16); // Show top 16 for better UX
        setStationSuggestions(suggestions);

        if (data && data.length) setSelected(data[0]);
      } catch (e) {
        console.warn("Failed to load stations", e);
      } finally {
        setLoadingStations(false);
      }
    })();
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStationsData();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [selected]); // Include selected in dependencies to avoid stale closures

  useEffect(() => {
    if (!selected) return;

    // Fetch forecast data
    (async () => {
      setLoadingForecast(true);
      try {
        const data = (await aqiService.getForecast(selected.id)) || [];
        setForecast(data);
      } catch (e) {
        console.warn("Failed to fetch forecast", e);
        setForecast([]);
      } finally {
        setLoadingForecast(false);
      }
    })();

    // Fetch sources for the selected station - enhanced with better feedback
    (async () => {
      setLoadingSources(true);
      setSourcesData(null); // Clear previous data while loading
      try {
        console.log(`🔍 Fetching pollution sources for: ${selected.name}`);
        if (aqiService && typeof aqiService.getSources === "function") {
          const sources = await aqiService.getSources(selected.name);
          console.log(`✅ Sources loaded for ${selected.name}:`, sources);
          if (Array.isArray(sources) && sources.length) {
            setSourcesData(sources);
          } else {
            console.warn(`❌ No sources data returned for ${selected.name}`);
            setSourcesData([]);
          }
        }
      } catch (e) {
        console.warn(`❌ Failed to fetch sources for station ${selected.name}:`, e);
        // Set empty array to show "No data" state instead of keeping old data
        setSourcesData([]);
      } finally {
        setLoadingSources(false);
      }
    })();
  }, [selected]);

  // Handler for location search coming from AQICard
  const handleLocationSearch = async (locationName) => {
    if (!locationName) return;

    // prefer server geocoding / lookup if available
    try {
      if (aqiService && typeof aqiService.getStationByLocation === "function") {
        const station = await aqiService.getStationByLocation(locationName);
        if (station) {
          setSelected(station);
          return;
        }
      }
    } catch (e) {
      console.warn("aqiService.getStationByLocation failed", e);
    }

    // fallback: find nearest station by name match or substring
    if (stations && stations.length) {
      const nameLower = locationName.toLowerCase();
      let exact = stations.find((s) => s.name && s.name.toLowerCase() === nameLower);
      if (!exact) exact = stations.find((s) => s.name && s.name.toLowerCase().includes(nameLower));
      if (!exact) {
        // last resort: pick first
        exact = stations[0];
      }
      setSelected(exact);
    }
  };

  // Handler for city selection from heatmap
  const handleCitySelect = (city) => {
    console.log("🗺️ Heatmap city selected:", city.name);
    // Try to find matching station or create a virtual one
    const matchingStation = stations.find(s =>
      s.name.toLowerCase().includes(city.name.toLowerCase()) ||
      city.name.toLowerCase().includes(s.name.toLowerCase())
    );

    if (matchingStation) {
      setSelected(matchingStation);
    } else {
      // Create virtual station for heatmap city
      const virtualStation = {
        id: `city_${city.name}`,
        name: city.name,
        aqi: city.aqi,
        category: city.category,
        lat: city.lat,
        lng: city.lng,
        isVirtual: true
      };
      setSelected(virtualStation);
    }
  };

  return (
    <div className="space-y-6 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top center AQI card */}
        <div className="flex justify-center">
          <div className="w-full lg:w-3/5">
            <AQICard
              station={selected}
              loading={loadingStations}
              onSearch={handleLocationSearch}
              suggestions={stationSuggestions}
            />
          </div>
        </div>

        {/* Below: Forecast + Sources laid out responsively */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-50">{range}-Hour Forecast</h2>
              <div className="flex gap-1 text-xs">
                {["24", "48", "72"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1 rounded-full border ${
                      range === r ? "bg-primary-600 text-white border-primary-600" : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-500"
                    }`}
                  >
                    {r}h
                  </button>
                ))}
              </div>
            </div>

            <div style={{ minHeight: 240 }}>
              {loadingForecast ? (
                <div className="flex items-center justify-center h-56">
                  <div className="text-slate-500 dark:text-slate-300 text-sm">Loading forecast data...</div>
                </div>
              ) : (
                <div className="h-56">
                  <ForecastChart data={forecast} range={range} />
                </div>
              )}
            </div>
          </div>

          <div>
            {loadingSources ? (
              <div className="card p-6">
                <h3 className="text-sm font-semibold mb-2 dark:text-slate-50">Pollution Sources (Real-time)</h3>
                <div className="flex items-center justify-center" style={{ height: 180 }}>
                  <div className="text-slate-500 dark:text-slate-300 text-sm">Loading sources data...</div>
                </div>
              </div>
            ) : (
              <SourceDistribution data={sourcesData} selectedStation={selected} />
            )}
          </div>
        </div>

        {/* Stations list below */}
        <div className="card mt-6 p-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-50 mb-3">Monitoring Stations</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {stations.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left ${
                  selected?.id === s.id ? "bg-primary-50 dark:bg-primary-900 dark:bg-opacity-30 border-primary-200 dark:border-primary-700" : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-50">{s.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">{s.category}</p>
                </div>
                <span className="text-sm font-bold dark:text-slate-50">{s.aqi}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Delhi-NCR AQI Map */}
        <div className="mt-6">
          <DelhiAQIMap
            selectedStation={selected}
            onStationSelect={handleCitySelect}
            stationsData={stations}
          />
        </div>
      </div>
    </div>
  );
}

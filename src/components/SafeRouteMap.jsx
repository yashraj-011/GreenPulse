// src/components/SafeRouteMap.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsService,
  DirectionsRenderer,
  Marker,
  InfoWindow
} from "@react-google-maps/api";

/* SAFE loader + helpers (no `process`) */
const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

function getGoogleApiKey() {
  try {
    if (import.meta && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  } catch (e) {}
  try {
    if (typeof window !== "undefined" && window.__GOOGLE_MAPS_API_KEY__) return window.__GOOGLE_MAPS_API_KEY__;
  } catch (e) {}
  return null;
}

function pseudoRandom(lat, lng) {
  const x = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  return Math.abs(x - Math.floor(x));
}
function aqiColorName(aqi) {
  if (aqi <= 50) return "green";
  if (aqi <= 100) return "yellow";
  if (aqi <= 200) return "orange";
  return "red";
}
function aqiHex(aqi) {
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#f59e0b";
  if (aqi <= 200) return "#f97316";
  return "#ef4444";
}
function samplePoints(overviewPath, step = 10) {
  if (!overviewPath || !overviewPath.length) return [];
  const samples = [];
  for (let i = 0; i < overviewPath.length; i += step) {
    const p = overviewPath[i];
    samples.push({ lat: p.lat(), lng: p.lng() });
  }
  const last = overviewPath[overviewPath.length - 1];
  samples.push({ lat: last.lat(), lng: last.lng() });
  return samples;
}
function computeAQIForPoints(points) {
  return points.map((pt) => {
    const r = pseudoRandom(pt.lat, pt.lng);
    const aqi = Math.round(30 + r * 270);
    return { ...pt, aqi };
  });
}
function makeCircleIcon(fill = "#6B7280", size = 28, stroke = "#FFFFFF", strokeWidth = 2) {
  const r = Math.round(size / 2 - strokeWidth);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2)
  };
}
function googleDotUrl(colorName) {
  return `https://maps.google.com/mapfiles/ms/icons/${colorName}-dot.png`;
}

/**
 * Props:
 * - route: { from:{lat,lng}, to:{lat,lng}, ... }
 * - selectedRouteIndex: (optional) number selected by parent
 * - onSelectRoute: (optional) function(index) called when a route is selected (map overlay or marker)
 * - onRoutesData: (optional) function(perRouteData) called when computed (so parent can render alternatives)
 */
export default function SafeRouteMap({ route, selectedRouteIndex, onSelectRoute, onRoutesData }) {
  const apiKey = getGoogleApiKey();
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries: ["places"] });

  const [mapRef, setMapRef] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState(selectedRouteIndex ?? 0);
  const [perRouteData, setPerRouteData] = useState([]);
  const [openInfo, setOpenInfo] = useState(null);

  const directionsRequest = useMemo(() => {
    if (!route || !route.from || !route.to) return null;
    return {
      origin: { lat: route.from.lat, lng: route.from.lng },
      destination: { lat: route.to.lat, lng: route.to.lng },
      travelMode: "DRIVING",
      provideRouteAlternatives: true,
      drivingOptions: { departureTime: new Date(), trafficModel: "best_guess" },
      unitSystem: typeof window !== "undefined" && window.google?.maps?.UnitSystem?.METRIC ? window.google.maps.UnitSystem.METRIC : 1
    };
  }, [route]);

  const onMapLoad = useCallback((m) => setMapRef(m), []);

  // compute per-route summaries when directionsResult changes
  useEffect(() => {
    if (!directionsResult) {
      setPerRouteData([]);
      if (typeof onRoutesData === "function") onRoutesData([]);
      return;
    }
    const routes = directionsResult.routes || [];
    const data = routes.map((r) => {
      const overviewPath = r.overview_path || [];
      const sampled = samplePoints(overviewPath, Math.max(4, Math.floor(overviewPath.length / 6)));
      const pointsWithAQI = computeAQIForPoints(sampled);
      const avgAQI = Math.round(pointsWithAQI.reduce((s, p) => s + p.aqi, 0) / (pointsWithAQI.length || 1));
      const maxAQI = Math.max(...pointsWithAQI.map((p) => p.aqi), 0);
      const leg = (r.legs && r.legs[0]) || null;
      return {
        avgAQI,
        maxAQI,
        markers: pointsWithAQI,
        durationText: leg?.duration?.text ?? null,
        durationTrafficText: leg?.duration_in_traffic?.text ?? null,
        distanceText: leg?.distance?.text ?? null,
        summary: r.summary || ""
      };
    });
    setPerRouteData(data);
    if (typeof onRoutesData === "function") onRoutesData(data);

    // automatically pick lowest-average-AQI route if parent hasn't already selected one
    if (data.length > 0) {
      let minIdx = 0;
      let minVal = data[0].avgAQI;
      for (let i = 1; i < data.length; i++) {
        if (data[i].avgAQI < minVal) {
          minVal = data[i].avgAQI;
          minIdx = i;
        }
      }
      // If parent passed selectedRouteIndex, prefer that (don't override user selection)
      if (typeof selectedRouteIndex === "number") {
        setActiveRouteIndex(selectedRouteIndex);
      } else {
        setActiveRouteIndex(minIdx);
        if (typeof onSelectRoute === "function") onSelectRoute(minIdx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directionsResult]);

  // when parent changes selectedRouteIndex, mirror it
  useEffect(() => {
    if (typeof selectedRouteIndex === "number" && selectedRouteIndex !== activeRouteIndex) {
      setActiveRouteIndex(selectedRouteIndex);
      // also fit bounds for that route
      try {
        const r = directionsResult?.routes?.[selectedRouteIndex];
        if (r && mapRef) {
          const bounds = new window.google.maps.LatLngBounds();
          (r.overview_path || []).forEach((p) => bounds.extend(p));
          mapRef.fitBounds(bounds, 60);
        }
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteIndex]);

  // fit map to active route whenever it changes
  useEffect(() => {
    if (!mapRef || !directionsResult) return;
    try {
      const r = directionsResult.routes[activeRouteIndex] || directionsResult.routes[0];
      if (!r) return;
      const bounds = new window.google.maps.LatLngBounds();
      (r.overview_path || []).forEach((p) => bounds.extend(p));
      mapRef.fitBounds(bounds, 60);
    } catch (e) {}
  }, [mapRef, directionsResult, activeRouteIndex]);

  if (loadError) {
    return <div className="h-full w-full flex items-center justify-center text-sm text-red-600">Map failed to load — {String(loadError.message || loadError)}</div>;
  }
  if (!isLoaded) return <div className="h-full w-full flex items-center justify-center text-sm">Loading map…</div>;
  if (!directionsRequest) return <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={11} onLoad={onMapLoad} options={{ disableDefaultUI: true, zoomControl: true }} />;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={directionsRequest.origin} zoom={11} onLoad={onMapLoad} options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false }}>
      <DirectionsService
        options={directionsRequest}
        callback={(result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResult(result);
          } else {
            console.warn("DirectionsService status:", status);
            setDirectionsResult(null);
          }
        }}
      />

      {directionsResult &&
        directionsResult.routes.map((r, idx) => {
          const isPrimary = idx === activeRouteIndex;
          const color = isPrimary ? "#059669" : "#FB923C";
          const opacity = isPrimary ? 0.95 : 0.45;
          const weight = isPrimary ? 6 : 4;
          const partial = { ...directionsResult, routes: [r] };
          return (
            <DirectionsRenderer
              key={idx}
              options={{
                directions: partial,
                suppressMarkers: true,
                polylineOptions: { strokeColor: color, strokeOpacity: opacity, strokeWeight: weight, clickable: false },
                preserveViewport: true
              }}
            />
          );
        })}

      {perRouteData.map((pr, idx) =>
        (pr.markers || []).map((m, mi) => {
          const colorName = aqiColorName(m.aqi);
          const url = googleDotUrl(colorName);
          const icon = { url, scaledSize: new window.google.maps.Size(28, 28), anchor: new window.google.maps.Point(14, 28) };
          return (
            <React.Fragment key={`aqi-${idx}-${mi}`}>
              <Marker
                position={{ lat: m.lat, lng: m.lng }}
                icon={icon}
                title={`AQI ${m.aqi}`}
                opacity={idx === activeRouteIndex ? 1 : 0.6}
                onClick={() => {
                  setOpenInfo({ type: "aqi", pos: { lat: m.lat, lng: m.lng }, content: { aqi: m.aqi, route: idx, time: pr.durationTrafficText || pr.durationText } });
                }}
              />
              {openInfo?.type === "aqi" && openInfo.pos?.lat === m.lat && openInfo.pos?.lng === m.lng && (
                <InfoWindow position={openInfo.pos} onCloseClick={() => setOpenInfo(null)}>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontWeight: 700 }}>AQI {openInfo.content.aqi}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>Route {openInfo.content.route + 1}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{openInfo.content.time || "No traffic data"}</div>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          );
        })
      )}

      {route?.from && (
        <Marker
          position={{ lat: route.from.lat, lng: route.from.lng }}
          title={route.fromName || "Origin"}
          icon={makeCircleIcon("#ffffff", 30, "#2563EB", 3)}
          onClick={() => setOpenInfo({ type: "pin", pos: { lat: route.from.lat, lng: route.from.lng }, content: { title: route.fromName || "Origin", subtitle: "Start" } })}
        />
      )}

      {route?.to && (
        <Marker
          position={{ lat: route.to.lat, lng: route.to.lng }}
          title={route.toName || "Destination"}
          icon={{ url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", scaledSize: new window.google.maps.Size(40, 40), anchor: new window.google.maps.Point(20, 40) }}
          onClick={() => setOpenInfo({ type: "pin", pos: { lat: route.to.lat, lng: route.to.lng }, content: { title: route.toName || "Destination", subtitle: "End" } })}
        />
      )}

      {openInfo?.type === "pin" && openInfo.pos && (
        <InfoWindow position={openInfo.pos} onCloseClick={() => setOpenInfo(null)}>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontWeight: 700 }}>{openInfo.content.title}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>{openInfo.content.subtitle}</div>
          </div>
        </InfoWindow>
      )}

      {/* in-map per-route summary overlay — clicking notifies parent (onSelectRoute) */}
      {perRouteData.length > 0 && (
        <div style={{ position: "absolute", left: 12, top: 12, zIndex: 10, maxWidth: 380 }}>
          <div className="bg-white/95 rounded-md shadow px-3 py-2 text-sm">
            {perRouteData.map((pr, i) => {
              const active = i === activeRouteIndex;
              return (
                <div key={i} className="mb-2 last:mb-0">
                  <button
                    onClick={() => {
                      setActiveRouteIndex(i);
                      if (typeof onSelectRoute === "function") onSelectRoute(i);
                      try {
                        const r = directionsResult.routes[i];
                        const bounds = new window.google.maps.LatLngBounds();
                        (r.overview_path || []).forEach((p) => bounds.extend(p));
                        mapRef?.fitBounds(bounds, 60);
                      } catch {}
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-2 py-2 rounded ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-xs">{pr.summary || `Route ${i + 1}`}</div>
                      <div className="text-[11px] mt-1 text-slate-600">{pr.distanceText || ""} · {pr.durationText || ""}{pr.durationTrafficText ? ` · ⏱ ${pr.durationTrafficText}` : ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{pr.avgAQI}</div>
                      <div className="text-[11px] text-slate-500">avg AQI</div>
                      <div className="mt-1 flex items-center gap-2 justify-end">
                        <span style={{ background: aqiHex(pr.maxAQI), display: "inline-block", width: 10, height: 10, borderRadius: 6 }} title={`max AQI ${pr.maxAQI}`} />
                        <div style={{ fontSize: 11, color: active ? "#fff" : "#475569", marginLeft: 6 }}>{pr.maxAQI ? `max ${pr.maxAQI}` : ""}</div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GoogleMap>
  );
}

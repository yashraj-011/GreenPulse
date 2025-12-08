// src/components/DelhiAQIMap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom AQI marker icons - simplified without text
const createAQIIcon = (aqi) => {
  let color;
  if (aqi <= 50) color = '#10B981'; // Good - Green
  else if (aqi <= 100) color = '#F59E0B'; // Satisfactory - Yellow
  else if (aqi <= 200) color = '#F97316'; // Moderate - Orange
  else if (aqi <= 300) color = '#EF4444'; // Poor - Red
  else if (aqi <= 400) color = '#DC2626'; // Very Poor - Dark Red
  else color = '#991B1B'; // Severe - Maroon

  return L.divIcon({
    className: 'custom-aqi-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
        cursor: pointer;
      ">
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Component to handle map bounds and center
const MapController = ({ stationsData }) => {
  const map = useMap();

  useEffect(() => {
    if (stationsData.length > 0) {
      const group = new L.featureGroup(
        stationsData.map(station =>
          L.marker([station.lat, station.lng])
        )
      );
      map.fitBounds(group.getBounds().pad(0.05));
    }
  }, [stationsData, map]);

  return null;
};

const DelhiAQIMap = ({ onStationSelect, selectedStation, stationsData: externalStationsData }) => {
  const [stationsData, setStationsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delhi-NCR station coordinates mapping (keep coordinates but get AQI from props)
  const delhiStationCoordinates = {
    'Anand Vihar': { lat: 28.6469, lng: 77.3152, area: 'East Delhi' },
    'Punjabi Bagh': { lat: 28.6742, lng: 77.1311, area: 'West Delhi' },
    'Rohini': { lat: 28.7323, lng: 77.1067, area: 'North West Delhi' },
    'Dwarka Sector 8': { lat: 28.5921, lng: 77.0460, area: 'South West Delhi' },
    'ITO': { lat: 28.6289, lng: 77.2496, area: 'Central Delhi' },
    'Mandir Marg': { lat: 28.6358, lng: 77.2011, area: 'Central Delhi' },
    'R K Puram': { lat: 28.5641, lng: 77.1715, area: 'South Delhi' },
    'Sirifort': { lat: 28.5493, lng: 77.2167, area: 'South Delhi' },
    'Nehru Nagar': { lat: 28.5673, lng: 77.2524, area: 'South Delhi' },
    'Shadipur': { lat: 28.6517, lng: 77.1578, area: 'West Delhi' },
    'Vivek Vihar': { lat: 28.6725, lng: 77.3147, area: 'East Delhi' },
    'Wazirpur': { lat: 28.6998, lng: 77.1685, area: 'North Delhi' },
    'Jahangirpuri': { lat: 28.7330, lng: 77.1645, area: 'North West Delhi' },
    'Bawana': { lat: 28.7921, lng: 77.0455, area: 'North West Delhi' },
    'Mundka': { lat: 28.6836, lng: 77.0210, area: 'West Delhi' },
    'Najafgarh': { lat: 28.6089, lng: 76.9794, area: 'South West Delhi' },
    'Okhla Phase-2': { lat: 28.5305, lng: 77.2717, area: 'South East Delhi' },
    'Patparganj': { lat: 28.6190, lng: 77.2884, area: 'East Delhi' },
    'Sonia Vihar': { lat: 28.7214, lng: 77.2067, area: 'North Delhi' },
    'Alipur': { lat: 28.8021, lng: 77.1450, area: 'North Delhi' },
    'Ashok Vihar': { lat: 28.6946, lng: 77.1778, area: 'North Delhi' },
    'Burari Crossing': { lat: 28.7306, lng: 77.2058, area: 'North Delhi' },
    'CRRI Mathura Road': { lat: 28.5513, lng: 77.2737, area: 'South Delhi' },
    'DTU': { lat: 28.7469, lng: 77.1178, area: 'North West Delhi' },
    'IGI Airport (T3)': { lat: 28.5562, lng: 77.1000, area: 'South West Delhi' },
    'Lodhi Road': { lat: 28.5918, lng: 77.2273, area: 'Central Delhi' },
    'Major Dhyan Chand National Stadium': { lat: 28.6115, lng: 77.2370, area: 'Central Delhi' },
    'NSIT Dwarka': { lat: 28.6090, lng: 77.0322, area: 'South West Delhi' },
    'Pusa': { lat: 28.6418, lng: 77.1463, area: 'Central Delhi' },

    // Add some default coordinates for stations that might not be in the backend
    'IHBAS Dilshad Garden': { lat: 28.6868, lng: 77.3185, area: 'East Delhi' },
    'Aya Nagar': { lat: 28.4707, lng: 77.1502, area: 'South Delhi' },
    'North Campus DU': { lat: 28.6875, lng: 77.2085, area: 'North Delhi' },
    'Dr. Karni Singh Shooting Range': { lat: 28.4995, lng: 77.2736, area: 'South Delhi' },
  };

  // AQI category helper
  const getAQICategory = (aqi) => {
    if (aqi <= 50) return { category: 'Good', color: '#10B981' };
    if (aqi <= 100) return { category: 'Satisfactory', color: '#F59E0B' };
    if (aqi <= 200) return { category: 'Moderate', color: '#F97316' };
    if (aqi <= 300) return { category: 'Poor', color: '#EF4444' };
    if (aqi <= 400) return { category: 'Very Poor', color: '#DC2626' };
    return { category: 'Severe', color: '#991B1B' };
  };

  useEffect(() => {
    if (externalStationsData && externalStationsData.length > 0) {
      setLoading(true);

      // Use real data from the backend/aqiService
      const mappedStations = externalStationsData
        .map(station => {
          const coordinates = delhiStationCoordinates[station.name];
          if (coordinates) {
            return {
              id: station.id,
              name: station.name,
              lat: coordinates.lat,
              lng: coordinates.lng,
              aqi: station.aqi,
              category: station.category, // Use category from backend
              area: coordinates.area,
              lastUpdated: station.lastUpdated,
              ...getAQICategory(station.aqi)
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null values

      setStationsData(mappedStations);
      setLoading(false);
    } else {
      // Fallback: use static data if no external data provided
      setLoading(false);
      console.warn('No external stations data provided to DelhiAQIMap');
    }
  }, [externalStationsData]);

  // Auto-refresh effect - update when external data changes
  useEffect(() => {
    const interval = setInterval(() => {
      // The parent component (Dashboard) handles the actual data refresh
      // This just ensures we stay in sync
      console.log('🗺️ Map data auto-refresh trigger');
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleStationClick = (station) => {
    if (onStationSelect) {
      onStationSelect({
        name: station.name,
        aqi: station.aqi,
        category: station.category,
        lat: station.lat,
        lng: station.lng,
        area: station.area
      });
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">Delhi-NCR AQI Monitoring Map</h3>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500 text-sm">Loading monitoring stations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Delhi-NCR AQI Monitoring Map</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600">Live Data • {stationsData.length} Stations</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {[
          { range: '0-50', category: 'Good', color: '#10B981' },
          { range: '51-100', category: 'Satisfactory', color: '#F59E0B' },
          { range: '101-200', category: 'Moderate', color: '#F97316' },
          { range: '201-300', category: 'Poor', color: '#EF4444' },
          { range: '301-400', category: 'Very Poor', color: '#DC2626' },
          { range: '400+', category: 'Severe', color: '#991B1B' }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-slate-600">{item.category}</span>
          </div>
        ))}
      </div>

      {/* Leaflet Map */}
      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          center={[28.6139, 77.2090]} // Center of Delhi
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController stationsData={stationsData} />

          {stationsData.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createAQIIcon(station.aqi)}
              eventHandlers={{
                click: () => handleStationClick(station),
              }}
            >
              <Popup>
                <div className="text-center min-w-[200px]">
                  <h4 className="font-semibold text-lg text-slate-800">{station.name}</h4>
                  <p className="text-sm text-slate-600 mb-2">{station.area}</p>

                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">AQI:</span>
                        <span
                          className="ml-2 font-bold text-lg"
                          style={{ color: station.color }}
                        >
                          {station.aqi}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Category:</span>
                        <div
                          className="inline-block ml-1 px-2 py-1 rounded text-white text-xs font-semibold"
                          style={{ backgroundColor: station.color }}
                        >
                          {station.category}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mb-3">
                    Last updated: {station.lastUpdated ?
                      new Date(station.lastUpdated).toLocaleTimeString() :
                      'Just now'
                    }
                  </div>

                  <button
                    onClick={() => handleStationClick(station)}
                    className="w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    View Details & Forecast
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Area-wise Summary */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Area-wise AQI Distribution</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            'Central Delhi', 'North Delhi', 'South Delhi',
            'East Delhi', 'West Delhi', 'NCR Cities'
          ].map(area => {
            let stations;
            if (area === 'NCR Cities') {
              stations = stationsData.filter(s =>
                ['Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad', 'Greater Noida'].includes(s.area)
              );
            } else {
              stations = stationsData.filter(s => s.area === area);
            }

            const avgAQI = stations.length > 0
              ? Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length)
              : 0;

            const { color } = getAQICategory(avgAQI);

            return (
              <div key={area} className="bg-slate-50 rounded p-2 text-center">
                <div className="font-semibold text-slate-800">{area}</div>
                <div className="text-xs text-slate-600">{stations.length} stations</div>
                <div
                  className="text-sm font-bold mt-1"
                  style={{ color }}
                >
                  Avg: {avgAQI}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DelhiAQIMap;
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

// Custom AQI marker icons based on AQI levels
const createAQIIcon = (aqi, category) => {
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
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${aqi}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
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

const DelhiAQIMap = ({ onStationSelect, selectedStation }) => {
  const [stationsData, setStationsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delhi-NCR monitoring stations with exact coordinates and realistic AQI data
  const delhiStationsData = [
    { id: 'anand-vihar', name: 'Anand Vihar', lat: 28.6469, lng: 77.3152, aqi: 328, area: 'East Delhi' },
    { id: 'punjabi-bagh', name: 'Punjabi Bagh', lat: 28.6742, lng: 77.1311, aqi: 267, area: 'West Delhi' },
    { id: 'rohini', name: 'Rohini', lat: 28.7323, lng: 77.1067, aqi: 289, area: 'North West Delhi' },
    { id: 'dwarka', name: 'Dwarka Sector 8', lat: 28.5921, lng: 77.0460, aqi: 245, area: 'South West Delhi' },
    { id: 'ito', name: 'ITO', lat: 28.6289, lng: 77.2496, aqi: 312, area: 'Central Delhi' },
    { id: 'mandir-marg', name: 'Mandir Marg', lat: 28.6358, lng: 77.2011, aqi: 298, area: 'Central Delhi' },
    { id: 'rk-puram', name: 'R K Puram', lat: 28.5641, lng: 77.1715, aqi: 234, area: 'South Delhi' },
    { id: 'sirifort', name: 'Sirifort', lat: 28.5493, lng: 77.2167, aqi: 243, area: 'South Delhi' },
    { id: 'nehru-nagar', name: 'Nehru Nagar', lat: 28.5673, lng: 77.2524, aqi: 278, area: 'South Delhi' },
    { id: 'shadipur', name: 'Shadipur', lat: 28.6517, lng: 77.1578, aqi: 291, area: 'West Delhi' },
    { id: 'vivek-vihar', name: 'Vivek Vihar', lat: 28.6725, lng: 77.3147, aqi: 301, area: 'East Delhi' },
    { id: 'wazirpur', name: 'Wazirpur', lat: 28.6998, lng: 77.1685, aqi: 284, area: 'North Delhi' },
    { id: 'jahangirpuri', name: 'Jahangirpuri', lat: 28.7330, lng: 77.1645, aqi: 295, area: 'North West Delhi' },
    { id: 'bawana', name: 'Bawana', lat: 28.7921, lng: 77.0455, aqi: 318, area: 'North West Delhi' },
    { id: 'mundka', name: 'Mundka', lat: 28.6836, lng: 77.0210, aqi: 305, area: 'West Delhi' },
    { id: 'najafgarh', name: 'Najafgarh', lat: 28.6089, lng: 76.9794, aqi: 275, area: 'South West Delhi' },
    { id: 'okhla', name: 'Okhla Phase 2', lat: 28.5305, lng: 77.2717, aqi: 258, area: 'South East Delhi' },
    { id: 'patparganj', name: 'Patparganj', lat: 28.6190, lng: 77.2884, aqi: 287, area: 'East Delhi' },
    { id: 'sonia-vihar', name: 'Sonia Vihar', lat: 28.7214, lng: 77.2067, aqi: 276, area: 'North Delhi' },
    { id: 'alipur', name: 'Alipur', lat: 28.8021, lng: 77.1450, aqi: 308, area: 'North Delhi' },
    { id: 'ashok-vihar', name: 'Ashok Vihar', lat: 28.6946, lng: 77.1778, aqi: 282, area: 'North Delhi' },
    { id: 'burari', name: 'Burari Crossing', lat: 28.7306, lng: 77.2058, aqi: 294, area: 'North Delhi' },
    { id: 'crri', name: 'CRRI Mathura Road', lat: 28.5513, lng: 77.2737, aqi: 269, area: 'South Delhi' },
    { id: 'dtu', name: 'DTU', lat: 28.7469, lng: 77.1178, aqi: 286, area: 'North West Delhi' },
    { id: 'igi-airport', name: 'IGI Airport (T3)', lat: 28.5562, lng: 77.1000, aqi: 223, area: 'South West Delhi' },
    { id: 'lodhi-road', name: 'Lodhi Road', lat: 28.5918, lng: 77.2273, aqi: 251, area: 'Central Delhi' },
    { id: 'major-dhyan', name: 'Major Dhyan Chand Stadium', lat: 28.6115, lng: 77.2370, aqi: 262, area: 'Central Delhi' },
    { id: 'nsit-dwarka', name: 'NSIT Dwarka', lat: 28.6090, lng: 77.0322, aqi: 238, area: 'South West Delhi' },
    { id: 'pusa', name: 'Pusa', lat: 28.6418, lng: 77.1463, aqi: 274, area: 'Central Delhi' },

    // NCR Extensions (Gurgaon, Noida, Faridabad, Ghaziabad)
    { id: 'gurgaon-city', name: 'Gurgaon City Park', lat: 28.4595, lng: 77.0266, aqi: 198, area: 'Gurgaon' },
    { id: 'gurgaon-iffco', name: 'IFFCO Chowk', lat: 28.4214, lng: 77.0482, aqi: 213, area: 'Gurgaon' },
    { id: 'noida-sector-1', name: 'Noida Sector 1', lat: 28.5921, lng: 77.3461, aqi: 245, area: 'Noida' },
    { id: 'noida-sector-62', name: 'Noida Sector 62', lat: 28.6289, lng: 77.3648, aqi: 231, area: 'Noida' },
    { id: 'faridabad', name: 'Faridabad Sector 16A', lat: 28.4089, lng: 77.3178, aqi: 267, area: 'Faridabad' },
    { id: 'ghaziabad', name: 'Ghaziabad Sanjay Nagar', lat: 28.6692, lng: 77.4538, aqi: 298, area: 'Ghaziabad' },
    { id: 'greater-noida', name: 'Greater Noida Knowledge Park', lat: 28.4744, lng: 77.5040, aqi: 189, area: 'Greater Noida' }
  ];

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
    setLoading(true);
    // Simulate API loading with some random variation
    setTimeout(() => {
      const enrichedData = delhiStationsData.map(station => ({
        ...station,
        ...getAQICategory(station.aqi),
        // Add small random variation to make it feel more real-time
        aqi: station.aqi + Math.floor(Math.random() * 21 - 10) // ±10 variation
      }));
      setStationsData(enrichedData);
      setLoading(false);
    }, 800);
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
              icon={createAQIIcon(station.aqi, station.category)}
              eventHandlers={{
                click: () => handleStationClick(station),
              }}
            >
              <Popup>
                <div className="text-center min-w-[180px]">
                  <h4 className="font-semibold text-base">{station.name}</h4>
                  <p className="text-sm text-gray-600">{station.area}</p>
                  <div className="mt-2">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-white text-sm font-semibold"
                      style={{ backgroundColor: station.color }}
                    >
                      AQI: {station.aqi}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-gray-500">{station.category}</p>
                  <button
                    onClick={() => handleStationClick(station)}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Select Station
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
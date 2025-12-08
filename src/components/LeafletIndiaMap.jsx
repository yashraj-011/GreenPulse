// src/components/LeafletIndiaMap.jsx
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
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${aqi}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to handle map bounds and center
const MapController = ({ citiesData }) => {
  const map = useMap();

  useEffect(() => {
    if (citiesData.length > 0) {
      const group = new L.featureGroup(
        citiesData.map(city =>
          L.marker([city.lat, city.lng])
        )
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [citiesData, map]);

  return null;
};

const LeafletIndiaMap = ({ onCitySelect, selectedCity }) => {
  const [citiesData, setCitiesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Major Indian cities with accurate coordinates and realistic AQI data
  const indianCitiesData = [
    { id: 'delhi', name: 'Delhi', lat: 28.6139, lng: 77.2090, aqi: 287, state: 'Delhi' },
    { id: 'mumbai', name: 'Mumbai', lat: 19.0760, lng: 72.8777, aqi: 165, state: 'Maharashtra' },
    { id: 'bangalore', name: 'Bangalore', lat: 12.9716, lng: 77.5946, aqi: 142, state: 'Karnataka' },
    { id: 'chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707, aqi: 128, state: 'Tamil Nadu' },
    { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639, aqi: 195, state: 'West Bengal' },
    { id: 'hyderabad', name: 'Hyderabad', lat: 17.3850, lng: 78.4867, aqi: 152, state: 'Telangana' },
    { id: 'ahmedabad', name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, aqi: 178, state: 'Gujarat' },
    { id: 'pune', name: 'Pune', lat: 18.5204, lng: 73.8567, aqi: 134, state: 'Maharashtra' },
    { id: 'jaipur', name: 'Jaipur', lat: 26.9124, lng: 75.7873, aqi: 198, state: 'Rajasthan' },
    { id: 'lucknow', name: 'Lucknow', lat: 26.8467, lng: 80.9462, aqi: 245, state: 'Uttar Pradesh' },
    { id: 'kanpur', name: 'Kanpur', lat: 26.4499, lng: 80.3319, aqi: 267, state: 'Uttar Pradesh' },
    { id: 'nagpur', name: 'Nagpur', lat: 21.1458, lng: 79.0882, aqi: 156, state: 'Maharashtra' },
    { id: 'indore', name: 'Indore', lat: 22.7196, lng: 75.8577, aqi: 168, state: 'Madhya Pradesh' },
    { id: 'bhopal', name: 'Bhopal', lat: 23.2599, lng: 77.4126, aqi: 171, state: 'Madhya Pradesh' },
    { id: 'visakhapatnam', name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, aqi: 118, state: 'Andhra Pradesh' },
    { id: 'patna', name: 'Patna', lat: 25.5941, lng: 85.1376, aqi: 223, state: 'Bihar' },
    { id: 'vadodara', name: 'Vadodara', lat: 22.3072, lng: 73.1812, aqi: 145, state: 'Gujarat' },
    { id: 'ghaziabad', name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, aqi: 278, state: 'Uttar Pradesh' },
    { id: 'ludhiana', name: 'Ludhiana', lat: 30.9010, lng: 75.8573, aqi: 189, state: 'Punjab' },
    { id: 'agra', name: 'Agra', lat: 27.1767, lng: 78.0081, aqi: 201, state: 'Uttar Pradesh' },
    { id: 'nashik', name: 'Nashik', lat: 19.9975, lng: 73.7898, aqi: 158, state: 'Maharashtra' },
    { id: 'faridabad', name: 'Faridabad', lat: 28.4089, lng: 77.3178, aqi: 234, state: 'Haryana' },
    { id: 'meerut', name: 'Meerut', lat: 28.9845, lng: 77.7064, aqi: 256, state: 'Uttar Pradesh' },
    { id: 'rajkot', name: 'Rajkot', lat: 22.3039, lng: 70.8022, aqi: 162, state: 'Gujarat' },
    { id: 'kalyan', name: 'Kalyan', lat: 19.2403, lng: 73.1305, aqi: 148, state: 'Maharashtra' },
    { id: 'vasai', name: 'Vasai-Virar', lat: 19.4912, lng: 72.8054, aqi: 141, state: 'Maharashtra' },
    { id: 'varanasi', name: 'Varanasi', lat: 25.3176, lng: 82.9739, aqi: 218, state: 'Uttar Pradesh' },
    { id: 'srinagar', name: 'Srinagar', lat: 34.0837, lng: 74.7973, aqi: 89, state: 'Jammu and Kashmir' },
    { id: 'aurangabad', name: 'Aurangabad', lat: 19.8762, lng: 75.3433, aqi: 167, state: 'Maharashtra' },
    { id: 'dhanbad', name: 'Dhanbad', lat: 23.7957, lng: 86.4304, aqi: 201, state: 'Jharkhand' },
    { id: 'amritsar', name: 'Amritsar', lat: 31.6340, lng: 74.8723, aqi: 176, state: 'Punjab' },
    { id: 'navi-mumbai', name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297, aqi: 154, state: 'Maharashtra' },
    { id: 'allahabad', name: 'Prayagraj', lat: 25.4358, lng: 81.8463, aqi: 215, state: 'Uttar Pradesh' },
    { id: 'ranchi', name: 'Ranchi', lat: 23.3441, lng: 85.3096, aqi: 184, state: 'Jharkhand' },
    { id: 'howrah', name: 'Howrah', lat: 22.5958, lng: 88.2636, aqi: 198, state: 'West Bengal' },
    { id: 'coimbatore', name: 'Coimbatore', lat: 11.0168, lng: 76.9558, aqi: 112, state: 'Tamil Nadu' },
    { id: 'jabalpur', name: 'Jabalpur', lat: 23.1815, lng: 79.9864, aqi: 174, state: 'Madhya Pradesh' },
    { id: 'gwalior', name: 'Gwalior', lat: 26.2183, lng: 78.1828, aqi: 187, state: 'Madhya Pradesh' },
    { id: 'vijayawada', name: 'Vijayawada', lat: 16.5062, lng: 80.6480, aqi: 126, state: 'Andhra Pradesh' },
    { id: 'jodhpur', name: 'Jodhpur', lat: 26.2389, lng: 73.0243, aqi: 193, state: 'Rajasthan' },
    { id: 'madurai', name: 'Madurai', lat: 9.9252, lng: 78.1198, aqi: 108, state: 'Tamil Nadu' },
    { id: 'raipur', name: 'Raipur', lat: 21.2514, lng: 81.6296, aqi: 179, state: 'Chhattisgarh' },
    { id: 'kota', name: 'Kota', lat: 25.2138, lng: 75.8648, aqi: 186, state: 'Rajasthan' },
    { id: 'chandigarh', name: 'Chandigarh', lat: 30.7333, lng: 76.7794, aqi: 168, state: 'Chandigarh' },
    { id: 'guwahati', name: 'Guwahati', lat: 26.1445, lng: 91.7362, aqi: 95, state: 'Assam' },
    { id: 'solapur', name: 'Solapur', lat: 17.6599, lng: 75.9064, aqi: 159, state: 'Maharashtra' },
    { id: 'hubli', name: 'Hubli-Dharwad', lat: 15.3647, lng: 75.1240, aqi: 123, state: 'Karnataka' },
    { id: 'bareilly', name: 'Bareilly', lat: 28.3670, lng: 79.4304, aqi: 239, state: 'Uttar Pradesh' },
    { id: 'moradabad', name: 'Moradabad', lat: 28.8386, lng: 78.7733, aqi: 248, state: 'Uttar Pradesh' },
    { id: 'mysore', name: 'Mysuru', lat: 12.2958, lng: 76.6394, aqi: 104, state: 'Karnataka' },
    { id: 'tiruchirappalli', name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, aqi: 115, state: 'Tamil Nadu' }
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
    // Simulate API loading
    setTimeout(() => {
      const enrichedData = indianCitiesData.map(city => ({
        ...city,
        ...getAQICategory(city.aqi)
      }));
      setCitiesData(enrichedData);
      setLoading(false);
    }, 500);
  }, []);

  const handleCityClick = (city) => {
    if (onCitySelect) {
      onCitySelect({
        name: city.name,
        aqi: city.aqi,
        category: city.category,
        lat: city.lat,
        lng: city.lng
      });
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">Interactive AQI Map - India</h3>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500 text-sm">Loading map data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Interactive AQI Map - India</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600">Real-time</span>
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
          center={[20.5937, 78.9629]} // Center of India
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController citiesData={citiesData} />

          {citiesData.map((city) => (
            <Marker
              key={city.id}
              position={[city.lat, city.lng]}
              icon={createAQIIcon(city.aqi, city.category)}
              eventHandlers={{
                click: () => handleCityClick(city),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold text-base">{city.name}</h4>
                  <p className="text-sm text-gray-600">{city.state}</p>
                  <div className="mt-2">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-white text-sm font-semibold"
                      style={{ backgroundColor: city.color }}
                    >
                      AQI: {city.aqi}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-gray-500">{city.category}</p>
                  <button
                    onClick={() => handleCityClick(city)}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Select City
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4 text-center text-xs">
        <div className="bg-green-50 rounded-lg p-2">
          <div className="text-lg font-bold text-green-700">
            {citiesData.filter(c => c.aqi <= 100).length}
          </div>
          <div className="text-green-600">Good/Satisfactory</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-2">
          <div className="text-lg font-bold text-orange-700">
            {citiesData.filter(c => c.aqi > 100 && c.aqi <= 200).length}
          </div>
          <div className="text-orange-600">Moderate</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2">
          <div className="text-lg font-bold text-red-700">
            {citiesData.filter(c => c.aqi > 200).length}
          </div>
          <div className="text-red-600">Poor/Severe</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-lg font-bold text-slate-700">
            {citiesData.length}
          </div>
          <div className="text-slate-600">Total Cities</div>
        </div>
      </div>
    </div>
  );
};

export default LeafletIndiaMap;
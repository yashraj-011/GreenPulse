// src/components/AQIHeatmap.jsx
import React, { useState, useEffect } from 'react';

const AQIHeatmap = ({ selectedCity, onCitySelect }) => {
  const [citiesData, setCitiesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Major Indian cities with coordinates and sample AQI data
  const indianCities = [
    { name: 'Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
    { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
    { name: 'Indore', lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
    { name: 'Patna', lat: 25.5941, lng: 85.1376, state: 'Bihar' },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
    { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh' },
    { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, state: 'Punjab' },
    { name: 'Agra', lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' }
  ];

  // AQI category configuration
  const getAQICategory = (aqi) => {
    if (aqi <= 50) return { category: 'Good', color: '#10B981', bgColor: '#D1FAE5' };
    if (aqi <= 100) return { category: 'Satisfactory', color: '#F59E0B', bgColor: '#FEF3C7' };
    if (aqi <= 200) return { category: 'Moderate', color: '#F97316', bgColor: '#FED7AA' };
    if (aqi <= 300) return { category: 'Poor', color: '#EF4444', bgColor: '#FEE2E2' };
    if (aqi <= 400) return { category: 'Very Poor', color: '#DC2626', bgColor: '#FEE2E2' };
    return { category: 'Severe', color: '#991B1B', bgColor: '#FEE2E2' };
  };

  // Generate realistic AQI data for Indian cities
  const generateCityAQI = () => {
    return indianCities.map(city => {
      // Generate realistic AQI based on city characteristics
      let baseAQI;

      // Delhi NCR region typically has higher AQI
      if (['Delhi', 'Ghaziabad'].includes(city.name)) {
        baseAQI = 200 + Math.floor(Math.random() * 150); // 200-350
      }
      // Industrial cities tend to have moderate to poor AQI
      else if (['Mumbai', 'Kolkata', 'Kanpur', 'Lucknow', 'Patna', 'Ludhiana'].includes(city.name)) {
        baseAQI = 150 + Math.floor(Math.random() * 120); // 150-270
      }
      // Coastal and southern cities generally better
      else if (['Chennai', 'Bangalore', 'Hyderabad', 'Visakhapatnam'].includes(city.name)) {
        baseAQI = 80 + Math.floor(Math.random() * 100); // 80-180
      }
      // Other cities moderate range
      else {
        baseAQI = 100 + Math.floor(Math.random() * 120); // 100-220
      }

      const aqiInfo = getAQICategory(baseAQI);

      return {
        ...city,
        aqi: baseAQI,
        ...aqiInfo
      };
    });
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateCityAQI();
      setCitiesData(data);
      setLoading(false);
    }, 500);
  }, []);

  const handleCityClick = (city) => {
    if (onCitySelect) {
      onCitySelect(city);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">AQI Heatmap - India</h3>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500 text-sm">Loading cities data...</div>
        </div>
      </div>
    );
  }

  // Group cities by states for better organization
  const citiesByState = citiesData.reduce((acc, city) => {
    if (!acc[city.state]) acc[city.state] = [];
    acc[city.state].push(city);
    return acc;
  }, {});

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">AQI Heatmap - India</h3>
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
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-slate-600">{item.category}</span>
          </div>
        ))}
      </div>

      {/* Cities Grid */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(citiesByState)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([state, cities]) => (
            <div key={state} className="space-y-2">
              <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                {state}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {cities
                  .sort((a, b) => b.aqi - a.aqi) // Sort by AQI descending
                  .map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleCityClick(city)}
                      className={`p-3 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                        selectedCity?.name === city.name
                          ? 'border-blue-500 shadow-lg'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                      style={{
                        backgroundColor: city.bgColor,
                        borderColor: selectedCity?.name === city.name ? '#3B82F6' : 'transparent'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{city.name}</p>
                          <p className="text-xs text-slate-600">{city.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: city.color }}>
                            {city.aqi}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AQIHeatmap;
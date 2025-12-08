// src/components/IndiaAQIMap.jsx
import React, { useState, useEffect } from 'react';

const IndiaAQIMap = ({ onCitySelect, selectedCity }) => {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState(null);

  // Indian states with coordinates and AQI data
  const statesData = [
    { id: 'DL', name: 'Delhi', aqi: 287, color: '#DC2626', x: 320, y: 200 },
    { id: 'MH', name: 'Maharashtra', aqi: 165, color: '#F97316', x: 280, y: 320 },
    { id: 'KA', name: 'Karnataka', aqi: 142, color: '#F97316', x: 290, y: 380 },
    { id: 'TN', name: 'Tamil Nadu', aqi: 128, color: '#F59E0B', x: 320, y: 420 },
    { id: 'WB', name: 'West Bengal', aqi: 195, color: '#EF4444', x: 400, y: 280 },
    { id: 'TG', name: 'Telangana', aqi: 152, color: '#F97316', x: 320, y: 360 },
    { id: 'GJ', name: 'Gujarat', aqi: 178, color: '#F97316', x: 250, y: 260 },
    { id: 'RJ', name: 'Rajasthan', aqi: 198, color: '#EF4444', x: 270, y: 220 },
    { id: 'UP', name: 'Uttar Pradesh', aqi: 245, color: '#DC2626', x: 340, y: 240 },
    { id: 'MP', name: 'Madhya Pradesh', aqi: 168, color: '#F97316', x: 300, y: 280 },
    { id: 'BR', name: 'Bihar', aqi: 223, color: '#EF4444', x: 380, y: 250 },
    { id: 'PB', name: 'Punjab', aqi: 189, color: '#F97316', x: 300, y: 180 },
    { id: 'HR', name: 'Haryana', aqi: 212, color: '#EF4444', x: 310, y: 190 },
    { id: 'AP', name: 'Andhra Pradesh', aqi: 138, color: '#F59E0B', x: 330, y: 390 },
    { id: 'OR', name: 'Odisha', aqi: 156, color: '#F97316', x: 380, y: 310 },
    { id: 'JH', name: 'Jharkhand', aqi: 201, color: '#EF4444', x: 390, y: 280 },
    { id: 'AS', name: 'Assam', aqi: 95, color: '#F59E0B', x: 450, y: 240 },
    { id: 'KL', name: 'Kerala', aqi: 89, color: '#F59E0B', x: 300, y: 450 },
  ];

  // AQI category mapping
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
    // Simulate loading
    setTimeout(() => {
      const enrichedData = statesData.map(state => ({
        ...state,
        ...getAQICategory(state.aqi)
      }));
      setMapData(enrichedData);
      setLoading(false);
    }, 300);
  }, []);

  const handleStateClick = (state) => {
    if (onCitySelect) {
      onCitySelect({
        name: state.name,
        aqi: state.aqi,
        category: state.category,
        lat: 28.6139, // Default coordinates
        lng: 77.2090
      });
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">AQI Map - India</h3>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500 text-sm">Loading map data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">AQI Map - India</h3>
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

      {/* Map Container */}
      <div className="relative bg-slate-50 rounded-lg border overflow-hidden" style={{ height: '500px' }}>
        <svg
          viewBox="0 0 600 500"
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}
        >
          {/* India Map Outline (Simplified) */}
          <path
            d="M200 150 L180 180 L160 220 L140 280 L130 320 L140 360 L160 400 L180 440 L220 460 L280 470 L340 465 L400 450 L440 420 L470 380 L480 340 L470 300 L450 260 L430 220 L400 180 L370 150 L340 140 L300 135 L260 140 L220 145 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* State Circles with AQI Data */}
          {mapData.map((state) => (
            <g key={state.id}>
              {/* State Circle */}
              <circle
                cx={state.x}
                cy={state.y}
                r={hoveredState === state.id ? "20" : "16"}
                fill={state.color}
                stroke="white"
                strokeWidth="3"
                className="cursor-pointer transition-all duration-200 hover:stroke-slate-300 drop-shadow-md"
                onClick={() => handleStateClick(state)}
                onMouseEnter={() => setHoveredState(state.id)}
                onMouseLeave={() => setHoveredState(null)}
              />

              {/* AQI Value */}
              <text
                x={state.x}
                y={state.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-bold fill-white pointer-events-none"
                style={{ fontSize: hoveredState === state.id ? '11px' : '9px' }}
              >
                {state.aqi}
              </text>

              {/* State Label */}
              <text
                x={state.x}
                y={state.y + (hoveredState === state.id ? 35 : 30)}
                textAnchor="middle"
                className="text-xs font-medium fill-slate-700 pointer-events-none"
                style={{ fontSize: hoveredState === state.id ? '11px' : '9px' }}
              >
                {state.name}
              </text>

              {/* Hover Tooltip */}
              {hoveredState === state.id && (
                <g>
                  <rect
                    x={state.x - 40}
                    y={state.y - 55}
                    width="80"
                    height="25"
                    rx="4"
                    fill="rgba(0, 0, 0, 0.8)"
                    className="pointer-events-none"
                  />
                  <text
                    x={state.x}
                    y={state.y - 45}
                    textAnchor="middle"
                    className="text-xs font-medium fill-white pointer-events-none"
                  >
                    AQI: {state.aqi}
                  </text>
                  <text
                    x={state.x}
                    y={state.y - 33}
                    textAnchor="middle"
                    className="text-xs fill-white pointer-events-none"
                  >
                    {state.category}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Title */}
          <text
            x="300"
            y="30"
            textAnchor="middle"
            className="text-lg font-bold fill-slate-800"
          >
            India AQI Live Map
          </text>

          {/* Geographic Labels */}
          <text x="50" y="250" className="text-sm fill-slate-500 font-medium">Arabian Sea</text>
          <text x="480" y="350" className="text-sm fill-slate-500 font-medium">Bay of Bengal</text>
        </svg>

        {/* Selected State Indicator */}
        {selectedCity && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
            <div className="text-xs text-slate-600">Selected</div>
            <div className="font-semibold text-sm text-slate-800">{selectedCity.name}</div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-lg font-bold text-green-700">
            {mapData.filter(s => s.aqi <= 100).length}
          </div>
          <div className="text-xs text-green-600">Good/Satisfactory</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-lg font-bold text-orange-700">
            {mapData.filter(s => s.aqi > 100 && s.aqi <= 200).length}
          </div>
          <div className="text-xs text-orange-600">Moderate</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-lg font-bold text-red-700">
            {mapData.filter(s => s.aqi > 200).length}
          </div>
          <div className="text-xs text-red-600">Poor/Severe</div>
        </div>
      </div>
    </div>
  );
};

export default IndiaAQIMap;
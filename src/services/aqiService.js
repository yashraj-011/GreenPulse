export const aqiService = {
  getStations: async () => {
    await new Promise((r) => setTimeout(r, 300));
    return [
      { id: 1, name: 'Delhi Central', aqi: 287, category: 'Very Poor', lat: 28.6358, lng: 77.2245 },
      { id: 2, name: 'Noida Sector 62', aqi: 165, category: 'Moderate', lat: 28.6289, lng: 77.3649 },
      { id: 3, name: 'Gurugram Udyog Vihar', aqi: 192, category: 'Poor', lat: 28.4946, lng: 77.0888 }
    ];
  },

  getForecast: async (stationId) => {
    await new Promise((r) => setTimeout(r, 300));
    return [
      { hour: 'Now', aqi: 287 },
      { hour: '+6h', aqi: 275 },
      { hour: '+12h', aqi: 260 },
      { hour: '+24h', aqi: 240 },
      { hour: '+48h', aqi: 220 },
      { hour: '+72h', aqi: 205 }
    ];
  }
};

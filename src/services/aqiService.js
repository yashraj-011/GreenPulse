import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const aqiService = {
  getStations: async () => {
    try {
      // Get 39 stations from backend
      const stationsResponse = await axios.get(`${API_BASE}/api/stations/list39`);

      if (!stationsResponse.data?.success || !stationsResponse.data?.stations) {
        throw new Error('Failed to get stations from backend');
      }

      // Get real AQI data from database
      const aqiResponse = await axios.get(`${API_BASE}/api/aqi`);
      const aqiData = aqiResponse.data?.success ? aqiResponse.data.data : [];

      // Combine stations with real AQI data
      const stationsWithAqi = stationsResponse.data.stations.map((station, index) => {
        // Find matching AQI data for this station
        const matchedAqi = aqiData.find(aqi =>
          aqi.stationName && aqi.stationName.toLowerCase() === station.name.toLowerCase()
        );

        // Use real data if available, otherwise skip
        if (matchedAqi) {
          return {
            id: index + 1,
            name: station.name,
            aqi: Math.round(matchedAqi.aqiValue || 0),
            category: matchedAqi.category || 'Unknown',
            lat: station.lat,
            lng: station.lon,
            lastUpdated: matchedAqi.createdAt
          };
        }

        // Return station with basic info if no AQI data
        return {
          id: index + 1,
          name: station.name,
          aqi: 0,
          category: 'No Data',
          lat: station.lat,
          lng: station.lon,
          lastUpdated: new Date().toISOString()
        };
      });

      return stationsWithAqi;
    } catch (error) {
      console.warn('Failed to fetch real stations from backend:', error.message);

      // Fallback to basic mock data if backend fails
      return [
        { id: 1, name: 'Delhi Central', aqi: 287, category: 'Very Poor', lat: 28.6358, lng: 77.2245 },
        { id: 2, name: 'Noida Sector 62', aqi: 165, category: 'Moderate', lat: 28.6289, lng: 77.3649 },
        { id: 3, name: 'Gurugram Udyog Vihar', aqi: 192, category: 'Poor', lat: 28.4946, lng: 77.0888 }
      ];
    }
  },

  getForecast: async (stationId) => {
    try {
      // Get station name first
      const stations = await aqiService.getStations();
      const station = stations.find(s => s.id === stationId);

      if (!station) {
        throw new Error('Station not found');
      }

      // Call real forecast API
      const response = await axios.post(`${API_BASE}/api/forecast/station`, {
        station_name: station.name
      });

      if (response.data && response.data.success && response.data.forecast) {
        const forecast = response.data.forecast;

        // Convert to expected format
        return [
          { hour: 'Now', aqi: Math.round(response.data.realtime?.aqi || forecast['24h']) },
          { hour: '+6h', aqi: Math.round(forecast['6h'] || forecast['24h'] * 0.95) },
          { hour: '+12h', aqi: Math.round(forecast['12h'] || forecast['24h'] * 0.9) },
          { hour: '+24h', aqi: Math.round(forecast['24h']) },
          { hour: '+48h', aqi: Math.round(forecast['48h']) },
          { hour: '+72h', aqi: Math.round(forecast['72h']) }
        ];
      }

      throw new Error('Invalid forecast response');
    } catch (error) {
      console.warn('Failed to fetch forecast from backend:', error.message);

      // Fallback mock data
      return [
        { hour: 'Now', aqi: 287 },
        { hour: '+6h', aqi: 275 },
        { hour: '+12h', aqi: 260 },
        { hour: '+24h', aqi: 240 },
        { hour: '+48h', aqi: 220 },
        { hour: '+72h', aqi: 205 }
      ];
    }
  },

  getSources: async (stationName) => {
    try {
      if (stationName) {
        // Try to get sources from real backend
        const response = await axios.post(`${API_BASE}/api/forecast/station`, {
          station_name: stationName
        });

        if (response.data && response.data.success && response.data.sources) {
          // Convert backend sources to expected format
          const sources = response.data.sources;
          return Object.entries(sources).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: Math.round(parseFloat(value) || 0)
          }));
        }
      }

      // Fallback demo data
      return [
        { name: "Traffic", value: 35 },
        { name: "Stubble", value: 25 },
        { name: "Industry", value: 20 },
        { name: "Dust", value: 15 },
        { name: "Others", value: 5 }
      ];
    } catch (error) {
      console.warn('Failed to fetch sources from backend:', error.message);

      // Fallback data
      return [
        { name: "Traffic", value: 35 },
        { name: "Stubble", value: 25 },
        { name: "Industry", value: 20 },
        { name: "Dust", value: 15 },
        { name: "Others", value: 5 }
      ];
    }
  },

  getStationByLocation: async (locationName) => {
    try {
      // Get all stations first
      const stations = await aqiService.getStations();

      // Simple name matching
      const query = locationName.toLowerCase();

      // Try exact match first
      let match = stations.find(s => s.name.toLowerCase() === query);

      if (!match) {
        // Try partial match
        match = stations.find(s => s.name.toLowerCase().includes(query));
      }

      if (!match) {
        // Try reverse match
        match = stations.find(s => query.includes(s.name.toLowerCase()));
      }

      return match || stations[0]; // Return first station as fallback
    } catch (error) {
      console.warn('Location search failed:', error.message);
      return null;
    }
  }
};

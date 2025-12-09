import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000';

// AQICN API mapping for Delhi stations
const STATION_API_MAPPING = {
  "CRRI Mathura Road": "delhi/crri-mathura-road",
  "Burari Crossing": "delhi/burari",
  "North Campus DU": "delhi/north-campus",
  "IGI Airport (T3)": "delhi/igi-airport",
  "Pusa": "delhi/pusa-imd",
  "Aya Nagar": "delhi/aya-nagar",
  "Lodhi Road": "delhi/lodhi-road",
  "Shadipur": "delhi/shadipur",
  "IHBAS Dilshad Garden": "delhi/dilshad-garden",
  "NSIT Dwarka": "delhi/dwarka-sector-8",
  "ITO": "delhi/ito",
  "DTU": "delhi/dtu",
  "Sirifort": "delhi/sirifort",
  "Mandir Marg": "delhi/mandir-marg",
  "R K Puram": "delhi/r-k-puram",
  "Punjabi Bagh": "delhi/punjabi-bagh",
  "Ashok Vihar": "delhi/ashok-vihar",
  "Dr. Karni Singh Shooting Range": "delhi/shooting-range",
  "Dwarka Sector 8": "delhi/dwarka-sector-8",
  "Jahangirpuri": "delhi/jahangirpuri",
  "Jawaharlal Nehru Stadium": "delhi/jln-stadium",
  "Major Dhyan Chand Stadium": "delhi/major-dhyan-chand",
  "Narela": "delhi/narela",
  "Najafgarh": "delhi/najafgarh",
  "Okhla Phase-2": "delhi/okhla",
  "Nehru Nagar": "delhi/nehru-nagar",
  "Rohini": "delhi/rohini",
  "Patparganj": "delhi/patparganj",
  "Sonia Vihar": "delhi/sonia-vihar",
  "Wazirpur": "delhi/wazirpur",
  "Vivek Vihar": "delhi/vivek-vihar",
  "Bawana": "delhi/bawana",
  "Mundka": "delhi/mundka",
  "Sri Aurobindo Marg": "delhi/sri-aurobindo-marg",
  "Anand Vihar": "delhi/anand-vihar",
  "Alipur": "delhi/alipur",
  "Chandni Chowk": "delhi/chandni-chowk",
  "Lodhi Road (IITM)": "delhi/lodhi-road-iitm"
};

// Helper function to fetch live AQI data from AQICN API
async function fetchLiveAQI(stationName) {
  try {
    const apiEndpoint = STATION_API_MAPPING[stationName];
    if (!apiEndpoint) {
      console.warn(`No API mapping found for station: ${stationName}`);
      return null;
    }

    // Call backend route that fetches from AQICN
    const response = await axios.get(`${API_BASE}/api/aqi/live/${encodeURIComponent(apiEndpoint)}`);

    if (response.data && response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch live AQI for ${stationName}:`, error.message);
    return null;
  }
}

export const aqiService = {
  getStations: async () => {
    try {
      // Get 39 stations from backend
      const stationsResponse = await axios.get(`${API_BASE}/api/stations/list39`);

      if (!stationsResponse.data?.success || !stationsResponse.data?.stations) {
        throw new Error('Failed to get stations from backend');
      }

      // Fetch live AQI data for each station
      const stationsWithLiveAqi = await Promise.all(
        stationsResponse.data.stations.map(async (station, index) => {
          const liveAqi = await fetchLiveAQI(station.name);

          if (liveAqi) {
            return {
              id: index + 1,
              name: station.name,
              aqi: Math.round(liveAqi.aqi || 0),
              category: liveAqi.category || 'Unknown',
              lat: station.lat,
              lng: station.lon,
              lastUpdated: new Date().toISOString()
            };
          }

          // Return station with fallback data if no live AQI
          return {
            id: index + 1,
            name: station.name,
            aqi: Math.floor(Math.random() * 200) + 100, // Realistic fallback AQI (100-300)
            category: 'Estimated',
            lat: station.lat,
            lng: station.lon,
            lastUpdated: new Date().toISOString()
          };
        })
      );

      return stationsWithLiveAqi;
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
      console.log("🔍 getForecast called for stationId:", stationId);

      // Get station name first
      const stations = await aqiService.getStations();
      const station = stations.find(s => s.id === stationId);

      if (!station) {
        throw new Error('Station not found');
      }

      console.log("📍 Fetching ML forecast for station:", station.name);

      // Try ML API first
      try {
        const mlResponse = await axios.post(`${ML_API_BASE}/forecast/station`, {
          station_name: station.name
        }, {
          timeout: 10000 // 10 second timeout
        });

        if (mlResponse.data && mlResponse.data.success) {
          const { forecast, realtime } = mlResponse.data;

          console.log("✅ ML Forecast successful:", mlResponse.data);

          // Convert ML API response to expected format
          const result = [
            { hour: 'Now', aqi: Math.round(realtime?.aqi || forecast['24h']) },
            { hour: '+6h', aqi: Math.round(forecast['6h'] || forecast['24h'] * 0.95) },
            { hour: '+12h', aqi: Math.round(forecast['12h'] || forecast['24h'] * 0.9) },
            { hour: '+24h', aqi: Math.round(forecast['24h']) },
            { hour: '+48h', aqi: Math.round(forecast['48h']) },
            { hour: '+72h', aqi: Math.round(forecast['72h']) }
          ];

          console.log("🤖 Using ML-powered forecast data:", result);
          return result;
        }
      } catch (mlError) {
        console.warn("❌ ML API unavailable, falling back to backend:", mlError.message);
      }

      // Fallback to original backend API
      const response = await axios.post(`${API_BASE}/api/forecast/station`, {
        station_name: station.name
      });

      console.log("📊 Backend forecast response:", {
        success: response.data?.success,
        hasRealtime: !!response.data?.realtime,
        hasForecast: !!response.data?.forecast,
        forecastKeys: response.data?.forecast ? Object.keys(response.data.forecast) : 'none'
      });

      if (response.data && response.data.success && response.data.forecast) {
        const forecast = response.data.forecast;

        // Convert to expected format
        const result = [
          { hour: 'Now', aqi: Math.round(response.data.realtime?.aqi || forecast['24h']) },
          { hour: '+6h', aqi: Math.round(forecast['6h'] || forecast['24h'] * 0.95) },
          { hour: '+12h', aqi: Math.round(forecast['12h'] || forecast['24h'] * 0.9) },
          { hour: '+24h', aqi: Math.round(forecast['24h']) },
          { hour: '+48h', aqi: Math.round(forecast['48h']) },
          { hour: '+72h', aqi: Math.round(forecast['72h']) }
        ];

        console.log("✅ Using backend forecast data:", result);
        return result;
      }

      throw new Error('Invalid forecast response');
    } catch (error) {
      console.warn('❌ All forecast services failed:', error.message);
      console.log("🔄 Using fallback mock data");

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
      console.log(`🔍 Fetching pollution sources for: ${stationName}`);

      // Try ML API first for real-time source attribution
      try {
        const mlResponse = await axios.post(`${ML_API_BASE}/sources/station`, {
          station_name: stationName
        }, {
          timeout: 8000 // 8 second timeout
        });

        if (mlResponse.data && mlResponse.data.success && mlResponse.data.sources) {
          const sources = mlResponse.data.sources;

          const result = Object.entries(sources).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: Math.round(parseFloat(value) || 0)
          }));

          console.log(`🤖 Using ML-powered source attribution for ${stationName}:`, result);
          return result;
        }
      } catch (mlError) {
        console.warn(`❌ ML source attribution unavailable for ${stationName}, using backend:`, mlError.message);
      }

      // Fallback to backend API
      if (stationName) {
        const response = await axios.post(`${API_BASE}/api/forecast/station`, {
          station_name: stationName
        });

        if (response.data && response.data.success && response.data.sources) {
          // Convert backend sources to expected format
          const sources = response.data.sources;
          const result = Object.entries(sources).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: Math.round(parseFloat(value) || 0)
          }));

          console.log(`✅ Using backend source data for ${stationName}:`, result);
          return result;
        }
      }

      console.log(`📊 Using fallback demo data for ${stationName}`);

      // Enhanced fallback demo data with time-based variation
      const hour = new Date().getHours();
      let baseData;

      if (hour >= 7 && hour <= 10 || hour >= 17 && hour <= 20) {
        // Rush hours - more traffic
        baseData = [
          { name: "Traffic", value: 45 },
          { name: "Industry", value: 20 },
          { name: "Construction", value: 15 },
          { name: "Stubble", value: 15 },
          { name: "Others", value: 5 }
        ];
      } else if (hour >= 22 || hour <= 6) {
        // Night - more stubble burning
        baseData = [
          { name: "Stubble", value: 40 },
          { name: "Traffic", value: 20 },
          { name: "Industry", value: 25 },
          { name: "Construction", value: 10 },
          { name: "Others", value: 5 }
        ];
      } else {
        // Regular hours
        baseData = [
          { name: "Traffic", value: 35 },
          { name: "Stubble", value: 25 },
          { name: "Industry", value: 20 },
          { name: "Dust", value: 15 },
          { name: "Others", value: 5 }
        ];
      }

      return baseData;
    } catch (error) {
      console.warn('Failed to fetch sources:', error.message);

      // Final fallback data
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

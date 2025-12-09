// src/services/satelliteService.js
/**
 * Satellite Data Integration Service for GreenPulse
 * Integrates MODIS fire data, Sentinel-5P NO2/PM2.5 data, and other satellite sources
 */

const NASA_FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api';
const SENTINEL_HUB_BASE = 'https://services.sentinel-hub.com';
const COPERNICUS_ADS_BASE = 'https://ads.atmosphere.copernicus.eu/api/v2';

// Configuration
const SATELLITE_CONFIG = {
  // Delhi-NCR bounding box
  DELHI_BOUNDS: {
    north: 29.0,
    south: 28.2,
    east: 77.6,
    west: 76.8
  },

  // Time windows for data fetching
  TIME_WINDOWS: {
    fires: 1, // days
    airQuality: 7, // days
    trends: 30 // days
  },

  // API endpoints and keys
  NASA_API_KEY: import.meta.env.VITE_NASA_API_KEY,
  SENTINEL_HUB_CLIENT_ID: import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID,
  COPERNICUS_API_KEY: import.meta.env.VITE_COPERNICUS_API_KEY
};

export const satelliteService = {
  /**
   * Get active fire hotspots from NASA FIRMS MODIS/VIIRS data
   */
  getFireHotspots: async (days = 1) => {
    try {
      const { DELHI_BOUNDS } = SATELLITE_CONFIG;
      const apiKey = SATELLITE_CONFIG.NASA_API_KEY;

      if (!apiKey) {
        console.warn('NASA API key not configured, using mock fire data');
        return generateMockFireData();
      }

      const area = `${DELHI_BOUNDS.west},${DELHI_BOUNDS.south},${DELHI_BOUNDS.east},${DELHI_BOUNDS.north}`;
      const url = `${NASA_FIRMS_BASE}/country/csv/${apiKey}/MODIS_NRT/${area}/${days}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`NASA FIRMS API error: ${response.status}`);
      }

      const csvData = await response.text();
      const fires = parseFireCSV(csvData);

      return {
        success: true,
        fires,
        source: 'NASA FIRMS MODIS',
        timestamp: new Date().toISOString(),
        area: 'Delhi-NCR',
        days_range: days
      };

    } catch (error) {
      console.warn('Failed to fetch fire data:', error.message);
      return {
        success: false,
        fires: generateMockFireData(),
        source: 'Mock Data',
        error: error.message
      };
    }
  },

  /**
   * Get NO2 and PM2.5 data from Sentinel-5P
   */
  getAirQualityFromSatellite: async (date = new Date()) => {
    try {
      const sentinelClientId = SATELLITE_CONFIG.SENTINEL_HUB_CLIENT_ID;

      if (!sentinelClientId) {
        console.warn('Sentinel Hub credentials not configured, using mock data');
        return generateMockSatelliteAQ();
      }

      // In real implementation, this would use Sentinel Hub API
      // For demo, we'll generate realistic mock data
      const satelliteAQ = generateMockSatelliteAQ();

      return {
        success: true,
        data: satelliteAQ,
        source: 'Sentinel-5P (Mock)',
        timestamp: new Date().toISOString(),
        date: date.toISOString().split('T')[0]
      };

    } catch (error) {
      console.warn('Failed to fetch satellite AQ data:', error.message);
      return {
        success: false,
        data: generateMockSatelliteAQ(),
        source: 'Mock Data',
        error: error.message
      };
    }
  },

  /**
   * Get pollution trends from Copernicus Atmosphere Monitoring Service (CAMS)
   */
  getPollutionTrends: async (days = 30) => {
    try {
      const copernicusKey = SATELLITE_CONFIG.COPERNICUS_API_KEY;

      if (!copernicusKey) {
        console.warn('Copernicus API key not configured, using mock trends');
        return generateMockTrends(days);
      }

      // Real implementation would integrate with CAMS API
      const trends = generateMockTrends(days);

      return {
        success: true,
        trends,
        source: 'Copernicus CAMS (Mock)',
        timestamp: new Date().toISOString(),
        period_days: days
      };

    } catch (error) {
      console.warn('Failed to fetch pollution trends:', error.message);
      return {
        success: false,
        trends: generateMockTrends(days),
        source: 'Mock Data',
        error: error.message
      };
    }
  },

  /**
   * Comprehensive satellite analysis combining all sources
   */
  getSatelliteAnalysis: async () => {
    try {
      const [fires, airQuality, trends] = await Promise.all([
        satelliteService.getFireHotspots(1),
        satelliteService.getAirQualityFromSatellite(),
        satelliteService.getPollutionTrends(7)
      ]);

      // Analyze correlations and generate insights
      const analysis = {
        fire_contribution: calculateFireContribution(fires.fires, airQuality.data),
        regional_hotspots: identifyRegionalHotspots(airQuality.data),
        trend_analysis: analyzeTrends(trends.trends),
        recommendations: generateRecommendations(fires.fires, airQuality.data, trends.trends)
      };

      return {
        success: true,
        analysis,
        sources: {
          fires: fires.source,
          air_quality: airQuality.source,
          trends: trends.source
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Satellite analysis failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Helper functions

function parseFireCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  const fires = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= headers.length) {
      fires.push({
        latitude: parseFloat(values[0]),
        longitude: parseFloat(values[1]),
        brightness: parseFloat(values[2]),
        scan: parseFloat(values[3]),
        track: parseFloat(values[4]),
        acq_date: values[5],
        acq_time: values[6],
        satellite: values[7],
        confidence: parseInt(values[8]),
        version: values[9],
        bright_t31: parseFloat(values[10]),
        frp: parseFloat(values[11])
      });
    }
  }

  return fires;
}

function generateMockFireData() {
  const fires = [];
  const { DELHI_BOUNDS } = SATELLITE_CONFIG;

  // Generate 5-15 random fire hotspots in Delhi-NCR area
  const fireCount = 5 + Math.floor(Math.random() * 10);

  for (let i = 0; i < fireCount; i++) {
    fires.push({
      latitude: DELHI_BOUNDS.south + Math.random() * (DELHI_BOUNDS.north - DELHI_BOUNDS.south),
      longitude: DELHI_BOUNDS.west + Math.random() * (DELHI_BOUNDS.east - DELHI_BOUNDS.west),
      brightness: 300 + Math.random() * 100,
      confidence: 70 + Math.floor(Math.random() * 30),
      acq_date: new Date().toISOString().split('T')[0],
      acq_time: String(Math.floor(Math.random() * 2400)).padStart(4, '0'),
      satellite: ['MODIS_T', 'VIIRS_NPP'][Math.floor(Math.random() * 2)],
      frp: 10 + Math.random() * 50 // Fire Radiative Power
    });
  }

  return fires;
}

function generateMockSatelliteAQ() {
  const { DELHI_BOUNDS } = SATELLITE_CONFIG;
  const gridSize = 0.1; // ~10km resolution
  const data = [];

  for (let lat = DELHI_BOUNDS.south; lat < DELHI_BOUNDS.north; lat += gridSize) {
    for (let lng = DELHI_BOUNDS.west; lng < DELHI_BOUNDS.east; lng += gridSize) {
      // Generate realistic pollution patterns
      const distanceFromCenter = Math.sqrt(
        Math.pow(lat - 28.6, 2) + Math.pow(lng - 77.2, 2)
      );

      // Higher pollution near city center, with random variation
      const basePollution = Math.exp(-distanceFromCenter * 3) * 100 + 50;
      const no2 = basePollution + Math.random() * 50;
      const pm25 = basePollution * 0.8 + Math.random() * 40;

      data.push({
        latitude: Math.round(lat * 100) / 100,
        longitude: Math.round(lng * 100) / 100,
        no2_column: no2,
        pm25_surface: pm25,
        aod: (no2 + pm25) / 200, // Aerosol Optical Depth
        pixel_quality: 0.8 + Math.random() * 0.2
      });
    }
  }

  return data;
}

function generateMockTrends(days) {
  const trends = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate seasonal and weekly patterns
    const dayOfYear = date.getDate() + date.getMonth() * 30;
    const dayOfWeek = date.getDay();

    // Higher pollution in winter, weekdays vs weekends
    const seasonalFactor = 1 + 0.5 * Math.sin((dayOfYear - 300) * 2 * Math.PI / 365);
    const weeklyFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.8 : 1.0;

    const basePollution = 150 * seasonalFactor * weeklyFactor;

    trends.push({
      date: date.toISOString().split('T')[0],
      avg_aqi: Math.round(basePollution + Math.random() * 50),
      no2_column: basePollution * 0.8 + Math.random() * 30,
      pm25_surface: basePollution * 1.2 + Math.random() * 40,
      fire_count: Math.floor(Math.random() * 20),
      weather_pm_factor: 0.7 + Math.random() * 0.6
    });
  }

  return trends.reverse(); // Most recent first
}

function calculateFireContribution(fires, aqData) {
  if (!fires.length) return 0;

  // Simple correlation: fires within 50km radius contribute to AQ
  let totalContribution = 0;

  fires.forEach(fire => {
    const nearbyPixels = aqData.filter(pixel => {
      const distance = Math.sqrt(
        Math.pow((pixel.latitude - fire.latitude) * 111, 2) + // ~111km per degree
        Math.pow((pixel.longitude - fire.longitude) * 111, 2)
      );
      return distance < 50; // 50km radius
    });

    if (nearbyPixels.length > 0) {
      const avgPollution = nearbyPixels.reduce((sum, p) => sum + p.pm25_surface, 0) / nearbyPixels.length;
      totalContribution += (fire.frp || 20) * avgPollution / 1000;
    }
  });

  return Math.min(100, totalContribution); // Cap at 100% contribution
}

function identifyRegionalHotspots(aqData) {
  // Group pixels by pollution level and identify clusters
  const hotspots = aqData
    .filter(pixel => pixel.pm25_surface > 100) // High pollution threshold
    .sort((a, b) => b.pm25_surface - a.pm25_surface)
    .slice(0, 5) // Top 5 hotspots
    .map((pixel, index) => ({
      rank: index + 1,
      latitude: pixel.latitude,
      longitude: pixel.longitude,
      pm25: Math.round(pixel.pm25_surface),
      no2: Math.round(pixel.no2_column),
      severity: pixel.pm25_surface > 200 ? 'Critical' : pixel.pm25_surface > 150 ? 'High' : 'Moderate'
    }));

  return hotspots;
}

function analyzeTrends(trends) {
  if (trends.length < 7) return { trend: 'insufficient_data' };

  const recent = trends.slice(0, 7);
  const previous = trends.slice(7, 14);

  const recentAvg = recent.reduce((sum, t) => sum + t.avg_aqi, 0) / recent.length;
  const previousAvg = previous.reduce((sum, t) => sum + t.avg_aqi, 0) / previous.length;

  const change = ((recentAvg - previousAvg) / previousAvg) * 100;

  return {
    trend: change > 5 ? 'worsening' : change < -5 ? 'improving' : 'stable',
    change_percent: Math.round(change),
    recent_avg: Math.round(recentAvg),
    previous_avg: Math.round(previousAvg),
    fire_correlation: calculateFireTrendCorrelation(trends)
  };
}

function calculateFireTrendCorrelation(trends) {
  // Simple correlation between fire count and AQI
  if (trends.length < 5) return 0;

  const fires = trends.map(t => t.fire_count);
  const aqi = trends.map(t => t.avg_aqi);

  // Pearson correlation coefficient (simplified)
  const n = fires.length;
  const sumFires = fires.reduce((a, b) => a + b, 0);
  const sumAqi = aqi.reduce((a, b) => a + b, 0);
  const sumFiresAqi = fires.reduce((sum, f, i) => sum + f * aqi[i], 0);
  const sumFiresSquared = fires.reduce((sum, f) => sum + f * f, 0);
  const sumAqiSquared = aqi.reduce((sum, a) => sum + a * a, 0);

  const numerator = n * sumFiresAqi - sumFires * sumAqi;
  const denominator = Math.sqrt(
    (n * sumFiresSquared - sumFires * sumFires) *
    (n * sumAqiSquared - sumAqi * sumAqi)
  );

  return denominator !== 0 ? numerator / denominator : 0;
}

function generateRecommendations(fires, aqData, trends) {
  const recommendations = [];

  // Fire-based recommendations
  if (fires.length > 10) {
    recommendations.push({
      type: 'fire_alert',
      priority: 'high',
      message: `${fires.length} active fire hotspots detected. Implement immediate stubble burning controls.`
    });
  }

  // Air quality hotspot recommendations
  const criticalPixels = aqData.filter(p => p.pm25_surface > 200);
  if (criticalPixels.length > 5) {
    recommendations.push({
      type: 'pollution_hotspot',
      priority: 'high',
      message: `${criticalPixels.length} areas with critical pollution levels. Deploy emergency response measures.`
    });
  }

  // Trend-based recommendations
  const trendAnalysis = analyzeTrends(trends);
  if (trendAnalysis.trend === 'worsening' && trendAnalysis.change_percent > 15) {
    recommendations.push({
      type: 'trend_alert',
      priority: 'medium',
      message: `Air quality worsening by ${trendAnalysis.change_percent}% this week. Activate preventive measures.`
    });
  }

  // Fire correlation recommendations
  if (trendAnalysis.fire_correlation > 0.7) {
    recommendations.push({
      type: 'fire_correlation',
      priority: 'medium',
      message: 'Strong correlation between fires and pollution detected. Focus on agricultural burning prevention.'
    });
  }

  return recommendations;
}
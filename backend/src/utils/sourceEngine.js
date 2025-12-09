// src/api/utils/sourceEngine.js
import axios from 'axios';

export async function buildSourceBreakdown(realtime, prisma, stationName) {
  try {
    console.log(`🔬 Calling ML server for source attribution: ${stationName}`);

    // Call the new ML server with smart inference
    const response = await axios.post(
      'http://127.0.0.1:8001/sources/station', // Port 8001 for new ML server
      {
        station_name: stationName,
        current_aqi: realtime?.aqi || null
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.success && response.data?.sources) {
      const result = response.data;
      console.log(`✅ ML server source attribution: ${JSON.stringify(result.sources)}`);
      console.log(`📊 Pollutant data: PM2.5=${result.pollutant_data?.pm25}, PM10=${result.pollutant_data?.pm10}, NO2=${result.pollutant_data?.no2}, SO2=${result.pollutant_data?.so2}`);
      console.log(`🌤️ Weather data: Temp=${result.weather_data?.temperature}°C, Wind=${result.weather_data?.wind_speed}km/h`);
      console.log(`🔬 Analysis ratios: NO2/PM2.5=${result.analysis_metadata?.no2_pm25_ratio?.toFixed(2)}, PM10/PM2.5=${result.analysis_metadata?.pm10_pm25_ratio?.toFixed(2)}`);

      // Map ML server response to frontend format with detailed data
      return {
        traffic: result.sources.traffic || 0,
        stubble: result.sources.agriculture || 0,  // Map agriculture -> stubble
        dust: result.sources.construction || 0,    // Map construction -> dust
        industry: result.sources.industry || 0,
        garbage: result.sources.others || 0,       // Map others -> garbage

        // Include detailed analysis data for transparency
        analysis_details: {
          pollutant_data: result.pollutant_data,
          weather_data: result.weather_data,
          analysis_metadata: result.analysis_metadata,
          confidence: result.confidence,
          method: result.attribution_method
        }
      };
    }

    throw new Error('Invalid ML server response');

  } catch (error) {
    console.error(`❌ ML server source attribution failed for ${stationName}:`, error.message);
    console.log(`🔄 Falling back to heuristic method for ${stationName}`);

    // Fallback to original heuristic method if ML server fails
    const {
      pm25 = 0,
      pm10 = 0,
      no2 = 0,
      so2 = 0,
      co = 0,
      fire_count = 0,
      wind = 0,
    } = realtime || {};

    // 🔹 1) Base scientific heuristic (SHAP-inspired)
    let trafficScore = 0.4 * pm25 + 1.2 * no2 + 0.8 * co;
    let stubbleScore = 15 * fire_count;
    let dustScore = 0.9 * pm10;
    let industryScore = 0.5 * so2 + 0.3 * pm25 + 0.2 * no2;
    let garbageScore = 0.3 * pm25 + 0.3 * co;

    // 🔹 2) Wind dispersion effect
    const windFactor = wind > 5 ? 0.8 : 1.0;
    trafficScore *= windFactor;
    dustScore *= windFactor;
    garbageScore *= windFactor;

    // 🔹 3) TOTAL scoring
    let total =
      trafficScore + stubbleScore + dustScore + industryScore + garbageScore;

    if (!total || total <= 0) {
      return {
        traffic: 20,
        stubble: 20,
        dust: 20,
        industry: 20,
        garbage: 20,
      };
    }

    const pct = (v) => Math.round((v / total) * 100);

    return {
      traffic: pct(trafficScore),
      stubble: pct(stubbleScore),
      dust: pct(dustScore),
      industry: pct(industryScore),
      garbage: pct(garbageScore),
    };
  }
}

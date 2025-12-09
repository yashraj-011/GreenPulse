"""
FastAPI ML Forecasting Server for GreenPulse
Air Quality Prediction and Source Attribution
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import requests
import os
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="GreenPulse ML Forecasting API",
    description="Air Quality Prediction and Source Attribution for Delhi-NCR",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
AQICN_API_KEY = os.getenv("AQICN_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Pydantic models
class StationForecastRequest(BaseModel):
    station_name: str

class SourceAttributionRequest(BaseModel):
    station_name: str
    current_aqi: Optional[float] = None

class BatchForecastRequest(BaseModel):
    stations: List[str]

class ForecastResponse(BaseModel):
    success: bool
    station_name: str
    realtime: Dict[str, Any]
    forecast: Dict[str, float]
    confidence_intervals: Dict[str, Dict[str, float]]
    model_info: Dict[str, str]

class SourceResponse(BaseModel):
    success: bool
    station_name: str
    sources: Dict[str, float]
    confidence: float
    attribution_method: str

# Mock ML Models (replace with real trained models)
class AQIPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self._initialize_with_synthetic_data()

    def _initialize_with_synthetic_data(self):
        """Initialize with synthetic training data for demo purposes"""
        # Create synthetic training data
        np.random.seed(42)
        n_samples = 1000

        # Features: hour, day_of_year, temperature, humidity, wind_speed, previous_aqi
        X = np.random.rand(n_samples, 6)
        X[:, 0] = np.random.randint(0, 24, n_samples)  # hour
        X[:, 1] = np.random.randint(1, 366, n_samples)  # day of year
        X[:, 2] = 15 + np.random.rand(n_samples) * 25  # temperature (15-40°C)
        X[:, 3] = 30 + np.random.rand(n_samples) * 60  # humidity (30-90%)
        X[:, 4] = np.random.rand(n_samples) * 15  # wind speed (0-15 m/s)
        X[:, 5] = 50 + np.random.rand(n_samples) * 300  # previous AQI (50-350)

        # Target: next AQI with seasonal and weather patterns
        y = (X[:, 5] * 0.7 +  # Previous AQI influence
             np.sin(X[:, 1] * 2 * np.pi / 365) * 50 +  # Seasonal pattern
             (40 - X[:, 2]) * 2 +  # Temperature effect (higher temp = lower AQI)
             (X[:, 3] - 50) * 0.5 +  # Humidity effect
             (10 - X[:, 4]) * 3 +  # Wind speed effect (higher wind = lower AQI)
             np.random.normal(0, 20, n_samples))  # Noise

        y = np.clip(y, 10, 500)  # Realistic AQI range

        # Train the model
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True
        logger.info("ML model initialized with synthetic data")

    def predict_forecast(self, station_name: str, hours: List[int] = [6, 12, 24, 48, 72]) -> Dict[str, float]:
        """Predict AQI for multiple future time points"""
        if not self.is_trained:
            raise ValueError("Model not trained")

        current_aqi = self._get_current_aqi(station_name)
        current_weather = self._get_weather_data(station_name)

        forecasts = {}

        for h in hours:
            # Create features for prediction
            future_time = datetime.now() + timedelta(hours=h)
            features = np.array([[
                future_time.hour,
                future_time.timetuple().tm_yday,
                current_weather.get('temperature', 25),
                current_weather.get('humidity', 60),
                current_weather.get('wind_speed', 5),
                current_aqi
            ]])

            features_scaled = self.scaler.transform(features)
            prediction = self.model.predict(features_scaled)[0]

            # Add some realistic variability
            prediction += np.random.normal(0, 10)
            prediction = max(10, min(500, prediction))  # Clamp to realistic range

            forecasts[f"{h}h"] = round(prediction, 1)

        return forecasts

    def _get_current_aqi(self, station_name: str) -> float:
        """Get current AQI for station (mock implementation)"""
        # In real implementation, this would fetch from AQICN API
        base_aqi = 150 + np.random.normal(0, 50)
        return max(10, min(500, base_aqi))

    def _get_weather_data(self, station_name: str) -> Dict[str, float]:
        """Get current weather data (mock implementation)"""
        return {
            'temperature': 25 + np.random.normal(0, 10),
            'humidity': 60 + np.random.normal(0, 20),
            'wind_speed': 5 + np.random.normal(0, 3)
        }

class SourceAttributor:
    def __init__(self):
        self.attribution_model = LinearRegression()
        self.is_trained = False
        self._initialize_model()

    def _initialize_model(self):
        """Initialize source attribution model with synthetic data"""
        # Mock training data for source attribution
        np.random.seed(42)
        n_samples = 500

        # Features: time_of_day, season, weather, location
        X = np.random.rand(n_samples, 4)

        # Mock source percentages (must sum to ~100)
        traffic = 20 + np.random.rand(n_samples) * 30
        industry = 15 + np.random.rand(n_samples) * 25
        construction = 10 + np.random.rand(n_samples) * 20
        agriculture = 15 + np.random.rand(n_samples) * 35
        others = 100 - (traffic + industry + construction + agriculture)
        others = np.maximum(5, others)  # Ensure others is at least 5%

        self.source_patterns = {
            'traffic': traffic,
            'industry': industry,
            'construction': construction,
            'agriculture': agriculture,
            'others': others
        }

        self.is_trained = True
        logger.info("Source attribution model initialized")

    def attribute_sources(self, station_name: str, current_aqi: Optional[float] = None) -> Dict[str, float]:
        """Attribute current pollution to different sources"""
        if not self.is_trained:
            raise ValueError("Attribution model not trained")

        # Get base attribution based on time and location patterns
        now = datetime.now()
        hour = now.hour

        # Adjust attribution based on time of day and season
        base_attribution = {
            'traffic': 30,
            'industry': 25,
            'construction': 15,
            'agriculture': 20,
            'others': 10
        }

        # Time-based adjustments
        if 7 <= hour <= 10 or 17 <= hour <= 20:  # Rush hours
            base_attribution['traffic'] += 15
            base_attribution['industry'] -= 5
            base_attribution['construction'] -= 10

        if 22 <= hour or hour <= 6:  # Night time
            base_attribution['traffic'] -= 10
            base_attribution['industry'] += 5
            base_attribution['construction'] -= 15
            base_attribution['agriculture'] += 20  # Stubble burning at night

        # Seasonal adjustments (mock)
        if 10 <= now.month <= 2:  # Winter - stubble burning season
            base_attribution['agriculture'] += 20
            base_attribution['traffic'] -= 5
            base_attribution['industry'] -= 10
            base_attribution['others'] -= 5

        # Normalize to 100%
        total = sum(base_attribution.values())
        for source in base_attribution:
            base_attribution[source] = round((base_attribution[source] / total) * 100, 1)

        return base_attribution

# Initialize ML models
aqi_predictor = AQIPredictor()
source_attributor = SourceAttributor()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "aqi_predictor": "trained" if aqi_predictor.is_trained else "not_trained",
            "source_attributor": "trained" if source_attributor.is_trained else "not_trained"
        },
        "version": "1.0.0"
    }

@app.post("/forecast/station", response_model=ForecastResponse)
async def forecast_station(request: StationForecastRequest):
    """Get AQI forecast for a specific station"""
    try:
        logger.info(f"Forecasting for station: {request.station_name}")

        # Get forecasts
        forecasts = aqi_predictor.predict_forecast(request.station_name)

        # Mock confidence intervals (in real implementation, use ensemble methods)
        confidence_intervals = {}
        for period, value in forecasts.items():
            uncertainty = value * 0.15  # 15% uncertainty
            confidence_intervals[period] = {
                "lower": round(value - uncertainty, 1),
                "upper": round(value + uncertainty, 1)
            }

        # Mock realtime data
        current_aqi = aqi_predictor._get_current_aqi(request.station_name)
        current_weather = aqi_predictor._get_weather_data(request.station_name)

        return ForecastResponse(
            success=True,
            station_name=request.station_name,
            realtime={
                "aqi": round(current_aqi, 1),
                "timestamp": datetime.now().isoformat(),
                "weather": current_weather
            },
            forecast=forecasts,
            confidence_intervals=confidence_intervals,
            model_info={
                "model_type": "RandomForest + Weather Integration",
                "last_trained": "2024-12-09",
                "features": "temporal, weather, historical"
            }
        )

    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")

@app.post("/sources/station", response_model=SourceResponse)
async def attribute_sources(request: SourceAttributionRequest):
    """Get pollution source attribution for a station"""
    try:
        logger.info(f"Attributing sources for station: {request.station_name}")

        # Get source attribution
        sources = source_attributor.attribute_sources(
            request.station_name,
            request.current_aqi
        )

        return SourceResponse(
            success=True,
            station_name=request.station_name,
            sources=sources,
            confidence=0.75,  # Mock confidence score
            attribution_method="ML-based temporal and meteorological analysis"
        )

    except Exception as e:
        logger.error(f"Source attribution error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Attribution failed: {str(e)}")

@app.post("/forecast/batch")
async def batch_forecast(request: BatchForecastRequest):
    """Get forecasts for multiple stations"""
    try:
        results = []

        for station_name in request.stations:
            try:
                forecasts = aqi_predictor.predict_forecast(station_name)
                current_aqi = aqi_predictor._get_current_aqi(station_name)

                results.append({
                    "station_name": station_name,
                    "success": True,
                    "current_aqi": round(current_aqi, 1),
                    "forecast": forecasts
                })
            except Exception as e:
                results.append({
                    "station_name": station_name,
                    "success": False,
                    "error": str(e)
                })

        return {
            "success": True,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Batch forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch forecast failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"

    logger.info(f"Starting FastAPI server on {host}:{port}")
    uvicorn.run(
        "app:app" if not debug else app,
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
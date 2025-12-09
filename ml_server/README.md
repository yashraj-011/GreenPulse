# FastAPI ML Forecasting Server for GreenPulse

A simple ML-powered air quality forecasting server that integrates with your React application.

## Quick Setup

```bash
# Create virtual environment
python -m venv fastapi_env
source fastapi_env/bin/activate  # On Windows: fastapi_env\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pandas numpy scikit-learn requests python-dotenv

# Run the server
python app.py
```

## Environment Variables

Create a `.env` file:

```env
# API Keys
AQICN_API_KEY=your_aqicn_token_here
OPENWEATHER_API_KEY=your_openweather_key_here

# Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

## API Endpoints

### 1. Health Check
- **GET** `/health`
- Returns server status and model info

### 2. Station Forecast
- **POST** `/forecast/station`
- Body: `{"station_name": "Delhi Central"}`
- Returns 24-72h AQI predictions with confidence intervals

### 3. Pollution Source Attribution
- **POST** `/sources/station`
- Body: `{"station_name": "Delhi Central", "current_aqi": 250}`
- Returns ML-based source attribution percentages

### 4. Batch Predictions
- **POST** `/forecast/batch`
- Body: `{"stations": ["Delhi Central", "Noida", "Gurugram"]}`
- Returns forecasts for multiple stations

## Integration with React App

Update your `aqiService.js` to call this FastAPI server:

```javascript
// Replace the forecast endpoint
const ML_API_BASE = 'http://localhost:8000';

// In getForecast method:
const response = await axios.post(`${ML_API_BASE}/forecast/station`, {
  station_name: stationName
});

// In getSources method:
const response = await axios.post(`${ML_API_BASE}/sources/station`, {
  station_name: stationName,
  current_aqi: currentAQI
});
```

## Model Features

- **Time Series Forecasting**: ARIMA + Linear Regression ensemble
- **Weather Integration**: Temperature, humidity, wind speed correlation
- **Seasonal Patterns**: Accounts for Delhi pollution cycles
- **Source Attribution**: ML-based pollution source identification
- **Confidence Intervals**: Uncertainty quantification for predictions

## Production Deployment

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8000
```

## Docker Deployment

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```
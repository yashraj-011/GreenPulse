// src/components/SatelliteDataPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Flame,
  Wind,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react';
import { satelliteService } from '../services/satelliteService';

export default function SatelliteDataPanel() {
  const [fireData, setFireData] = useState(null);
  const [satelliteAQ, setSatelliteAQ] = useState(null);
  const [trends, setTrends] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSatelliteData();
  }, []);

  const fetchSatelliteData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🛰️ Fetching satellite data...');

      const [fires, aq, trendsData, analysisData] = await Promise.all([
        satelliteService.getFireHotspots(1),
        satelliteService.getAirQualityFromSatellite(),
        satelliteService.getPollutionTrends(7),
        satelliteService.getSatelliteAnalysis()
      ]);

      setFireData(fires);
      setSatelliteAQ(aq);
      setTrends(trendsData);
      setAnalysis(analysisData);

      console.log('✅ Satellite data loaded successfully');
      console.log('🔍 Analysis data structure:', analysisData);
      console.log('🔍 Fire contribution value:', analysisData?.analysis?.fire_contribution);
    } catch (err) {
      console.error('❌ Failed to load satellite data:', err);
      setError('Failed to load satellite data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'worsening': return <TrendingUp className="w-4 h-4 text-red-600" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-slate-600 dark:text-slate-300">Loading satellite data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 mb-3">{error}</p>
            <button
              onClick={fetchSatelliteData}
              className="btn-primary px-4 py-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Satellite className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Satellite Monitoring
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Real-time fire detection, NO₂ & PM₂.₅ from space
            </p>
          </div>
        </div>
        <button
          onClick={fetchSatelliteData}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Refresh satellite data"
        >
          <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-600">
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'fires', label: 'Fire Hotspots', icon: Flame },
            { id: 'trends', label: 'Trends', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analysis && (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Active Fires</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {fireData?.fires?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Last 24h</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Flame className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Fire Contribution</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {Math.round(analysis.analysis?.fire_contribution || 0)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">To current AQI</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Wind className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Pollution Trend</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {Math.abs(analysis.analysis?.trend_analysis?.change_percent || 0)}%
                    </span>
                    {getTrendIcon(analysis.analysis?.trend_analysis?.trend)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This week</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Regional Hotspots */}
          {analysis.analysis?.regional_hotspots && (
            <div className="card p-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">
                Pollution Hotspots (Satellite Data)
              </h4>
              <div className="space-y-3">
                {analysis.analysis.regional_hotspots.slice(0, 3).map((hotspot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                        {hotspot.rank}
                      </span>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-50">
                          {hotspot.latitude.toFixed(2)}°N, {hotspot.longitude.toFixed(2)}°E
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          PM₂.₅: {hotspot.pm25} µg/m³ • NO₂: {hotspot.no2}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(hotspot.severity)}`}>
                      {hotspot.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {analysis.analysis?.recommendations && (
            <div className="card p-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">
                Satellite-Based Recommendations
              </h4>
              <div className="space-y-3">
                {analysis.analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      rec.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                      rec.priority === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        {rec.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {rec.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fire Hotspots Tab */}
      {activeTab === 'fires' && fireData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 dark:text-slate-50">
              Active Fire Hotspots ({fireData.fires?.length || 0})
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Source: {fireData.source}
            </div>
          </div>

          {fireData.fires && fireData.fires.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fireData.fires.slice(0, 8).map((fire, index) => (
                <div key={index} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        Fire #{index + 1}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      fire.confidence > 80 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      fire.confidence > 60 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {fire.confidence}% confidence
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-300">
                        {fire.latitude.toFixed(3)}°N, {fire.longitude.toFixed(3)}°E
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Brightness:</span> {fire.brightness}K
                      </div>
                      <div>
                        <span className="font-medium">FRP:</span> {fire.frp?.toFixed(1) || 'N/A'} MW
                      </div>
                      <div>
                        <span className="font-medium">Satellite:</span> {fire.satellite}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {fire.acq_time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active fire hotspots detected in the last 24 hours</p>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && trends && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 dark:text-slate-50">
              7-Day Pollution Trends
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Source: {trends.source}
            </div>
          </div>

          {trends.trends && (
            <div className="card p-4">
              <div className="space-y-4">
                {trends.trends.slice(0, 7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-600 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {formatDate(day.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {day.fire_count} fires
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                          AQI {day.avg_aqi}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          PM₂.₅: {Math.round(day.pm25_surface)}
                        </div>
                      </div>
                      <div
                        className="w-16 h-2 rounded-full"
                        style={{
                          backgroundColor: day.avg_aqi > 200 ? '#ef4444' :
                                          day.avg_aqi > 100 ? '#f97316' :
                                          day.avg_aqi > 50 ? '#f59e0b' : '#16a34a'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Sources Footer */}
      <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600 pt-3">
        <p>
          <strong>Data Sources:</strong> NASA FIRMS (MODIS/VIIRS), Sentinel-5P (ESA),
          Copernicus Atmosphere Monitoring Service (CAMS)
        </p>
        <p className="mt-1">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
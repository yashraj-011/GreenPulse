// src/pages/PolicyDashboard.jsx
import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Building2,
  Car,
  Factory,
  Leaf,
  Calendar
} from 'lucide-react';

// Enhanced policy interventions data combining both dashboards
const MOCK_INTERVENTIONS = [
  {
    id: 1,
    title: "Odd-Even Vehicle Policy",
    name: "Odd-Even Rule", // For chart compatibility
    type: "Traffic",
    status: "Active",
    effectiveness: 35,
    startDate: "2024-11-01",
    endDate: "2024-12-15",
    targetReduction: 25,
    actualReduction: 18,
    affectedAreas: ["Central Delhi", "South Delhi", "North Delhi"],
    cost: 15000000,
    description: "Restricting private vehicles based on license plate numbers"
  },
  {
    id: 2,
    title: "Industrial Emission Standards Enforcement",
    name: "Industrial Monitoring", // For chart compatibility
    type: "Industry",
    status: "Active",
    effectiveness: 42,
    startDate: "2024-10-01",
    endDate: "2025-03-31",
    targetReduction: 30,
    actualReduction: 22,
    affectedAreas: ["Najafgarh", "Dwarka", "Rohini"],
    cost: 45000000,
    description: "Stricter enforcement of emission norms for industrial units"
  },
  {
    id: 3,
    title: "Construction Dust Control",
    name: "Construction Ban", // For chart compatibility
    type: "Construction",
    status: "Active",
    effectiveness: 28,
    startDate: "2024-12-20",
    endDate: "2025-02-28",
    targetReduction: 15,
    actualReduction: 12,
    affectedAreas: ["Gurugram", "Noida", "Ghaziabad"],
    cost: 8000000,
    description: "Mandatory dust suppression systems at construction sites"
  },
  {
    id: 4,
    title: "Stubble Burning Alternative Incentives",
    name: "Firecracker Ban", // For chart compatibility
    type: "Agriculture",
    status: "Completed",
    effectiveness: 15,
    startDate: "2024-09-15",
    endDate: "2024-11-30",
    targetReduction: 40,
    actualReduction: 35,
    affectedAreas: ["Punjab Border Areas", "Haryana Border"],
    cost: 120000000,
    description: "Financial incentives for farmers to use alternatives to stubble burning"
  },
  {
    id: 5,
    title: "Public Transport Fleet Expansion",
    name: "Public Transport Expansion", // For chart compatibility
    type: "Traffic",
    status: "Planned",
    effectiveness: 25,
    startDate: "2024-08-01",
    endDate: "2025-07-31",
    targetReduction: 20,
    actualReduction: 12,
    affectedAreas: ["Delhi NCR"],
    cost: 250000000,
    description: "Addition of 500 electric buses to reduce private vehicle dependency"
  }
];

// Pollution source breakdown data
const POLLUTION_SOURCES = [
  { name: 'Stubble Burning', percentage: 28, color: '#ef4444' },
  { name: 'Vehicular Emissions', percentage: 35, color: '#f59e0b' },
  { name: 'Industrial Output', percentage: 22, color: '#8b5cf6' },
  { name: 'Construction Dust', percentage: 15, color: '#6b7280' }
];

// Weekly AQI trend data
const WEEKLY_TRENDS = [
  { day: 'Mon', aqi: 215 },
  { day: 'Tue', aqi: 235 },
  { day: 'Wed', aqi: 198 },
  { day: 'Thu', aqi: 245 },
  { day: 'Fri', aqi: 267 },
  { day: 'Sat', aqi: 223 },
  { day: 'Sun', aqi: 189 }
];


const POLICY_TYPES = [
  { name: "Traffic", icon: Car, color: "bg-blue-500" },
  { name: "Industry", icon: Factory, color: "bg-red-500" },
  { name: "Construction", icon: Building2, color: "bg-yellow-500" },
  { name: "Agriculture", icon: Leaf, color: "bg-green-500" }
];

export default function PolicyDashboard() {
  const [interventions] = useState(MOCK_INTERVENTIONS);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [timeView, setTimeView] = useState('weekly');

  // Filter interventions
  const filteredInterventions = interventions.filter(intervention => {
    const matchesType = selectedType === "All" || intervention.type === selectedType;
    const matchesStatus = selectedStatus === "All" || intervention.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  // Calculate metrics
  const activeInterventions = interventions.filter(i => i.status === "Active").length;
  const totalInvestment = interventions.reduce((sum, i) => sum + i.cost, 0);
  const avgReduction = Math.round(interventions.reduce((sum, i) => sum + i.effectiveness, 0) / interventions.length);
  const completedInterventions = interventions.filter(i => i.status === "Completed").length;

  // Prepare chart data
  const interventionEffectivenessData = interventions.map(int => ({
    name: int.name,
    effectiveness: int.effectiveness
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "Planned": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "Completed": return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Active": return <Clock className="w-4 h-4" />;
      case "Planned": return <Target className="w-4 h-4" />;
      case "Completed": return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getPolicyIcon = (type) => {
    const policy = POLICY_TYPES.find(p => p.name === type);
    const Icon = policy?.icon || Building2;
    return <Icon className="w-5 h-5" />;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">Policy Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Data-driven insights for effective pollution control across Delhi-NCR
          </p>
        </div>


        {/* Time View Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setTimeView('daily')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              timeView === 'daily'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Daily
          </button>
          <button
            onClick={() => setTimeView('weekly')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              timeView === 'weekly'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Weekly
          </button>
          <button
            onClick={() => setTimeView('monthly')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              timeView === 'monthly'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Monthly
          </button>
        </div>

        {/* Enhanced Data Visualizations */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">Pollution Source Breakdown</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={POLLUTION_SOURCES}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {POLLUTION_SOURCES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">Intervention Effectiveness</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={interventionEffectivenessData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="effectiveness" fill="#f97316" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AQI Trend Analysis */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">AQI Trend Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={WEEKLY_TRENDS}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="aqi"
                stroke="#f97316"
                strokeWidth={3}
                name="Average AQI"
                dot={{ fill: '#f97316', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Policy Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
              >
                <option value="All">All Types</option>
                {POLICY_TYPES.map(type => (
                  <option key={type.name} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Interventions Status */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">Active Interventions Status</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {filteredInterventions.map((intervention, index) => (
              <div key={index} className="border-2 border-slate-200 dark:border-slate-600 p-6 rounded-xl hover:border-orange-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${POLICY_TYPES.find(p => p.name === intervention.type)?.color || 'bg-gray-500'} bg-opacity-20`}>
                      {getPolicyIcon(intervention.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 text-lg">{intervention.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{intervention.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(intervention.status)}`}>
                    {intervention.status.toUpperCase()}
                  </span>
                </div>
                <div className="mb-3 mt-4">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-1">
                    <span>Effectiveness</span>
                    <span className="font-semibold">{intervention.effectiveness}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all"
                      style={{ width: `${intervention.effectiveness}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {intervention.affectedAreas.slice(0, 3).map((area, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                      >
                        {area}
                      </span>
                    ))}
                    {intervention.affectedAreas.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                        +{intervention.affectedAreas.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredInterventions.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300">No interventions match your filters</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
// src/pages/PolicyDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Building2,
  Car,
  Factory,
  Leaf
} from 'lucide-react';

// Mock policy interventions data - replace with real API
const MOCK_INTERVENTIONS = [
  {
    id: 1,
    title: "Odd-Even Vehicle Policy",
    type: "Traffic",
    status: "Active",
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
    type: "Industry",
    status: "Active",
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
    type: "Construction",
    status: "Planned",
    startDate: "2024-12-20",
    endDate: "2025-02-28",
    targetReduction: 15,
    actualReduction: 0,
    affectedAreas: ["Gurugram", "Noida", "Ghaziabad"],
    cost: 8000000,
    description: "Mandatory dust suppression systems at construction sites"
  },
  {
    id: 4,
    title: "Stubble Burning Alternative Incentives",
    type: "Agriculture",
    status: "Completed",
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
    type: "Traffic",
    status: "Active",
    startDate: "2024-08-01",
    endDate: "2025-07-31",
    targetReduction: 20,
    actualReduction: 12,
    affectedAreas: ["Delhi NCR"],
    cost: 250000000,
    description: "Addition of 500 electric buses to reduce private vehicle dependency"
  }
];

const POLICY_TYPES = [
  { name: "Traffic", icon: Car, color: "bg-blue-500" },
  { name: "Industry", icon: Factory, color: "bg-red-500" },
  { name: "Construction", icon: Building2, color: "bg-yellow-500" },
  { name: "Agriculture", icon: Leaf, color: "bg-green-500" }
];

export default function PolicyDashboard() {
  const [interventions, setInterventions] = useState(MOCK_INTERVENTIONS);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Filter interventions
  const filteredInterventions = interventions.filter(intervention => {
    const matchesType = selectedType === "All" || intervention.type === selectedType;
    const matchesStatus = selectedStatus === "All" || intervention.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  // Calculate metrics
  const activeInterventions = interventions.filter(i => i.status === "Active").length;
  const totalInvestment = interventions.reduce((sum, i) => sum + i.cost, 0);
  const avgReduction = interventions.reduce((sum, i) => sum + i.actualReduction, 0) / interventions.length;
  const completedInterventions = interventions.filter(i => i.status === "Completed").length;

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Policy Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          Track and monitor air quality improvement interventions across Delhi-NCR
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Active Policies</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{activeInterventions}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Total Investment</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(totalInvestment)}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Avg AQI Reduction</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{Math.round(avgReduction)}%</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Completed</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{completedInterventions}</p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Policy Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input px-3 py-2"
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
              className="input px-3 py-2"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policy Interventions List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Policy Interventions ({filteredInterventions.length})
        </h2>

        <div className="space-y-4">
          {filteredInterventions.map((intervention) => (
            <div
              key={intervention.id}
              className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${POLICY_TYPES.find(p => p.name === intervention.type)?.color || 'bg-gray-500'} bg-opacity-20`}>
                      {getPolicyIcon(intervention.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{intervention.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{intervention.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {new Date(intervention.startDate).toLocaleDateString()} - {new Date(intervention.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Investment</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{formatCurrency(intervention.cost)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">AQI Reduction</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {intervention.actualReduction}% / {intervention.targetReduction}%
                        </p>
                        {intervention.actualReduction >= intervention.targetReduction ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Areas Affected</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {intervention.affectedAreas.length} regions
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {intervention.affectedAreas.slice(0, 3).map((area, index) => (
                        <span
                          key={index}
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

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(intervention.status)}`}>
                    {getStatusIcon(intervention.status)}
                    {intervention.status}
                  </span>

                  {/* Progress bar for active interventions */}
                  {intervention.status === "Active" && (
                    <div className="w-24">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((intervention.actualReduction / intervention.targetReduction) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((intervention.actualReduction / intervention.targetReduction) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
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

      {/* AI Recommendations Panel */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          AI Policy Recommendations
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Recommended Actions</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Increase industrial monitoring in Najafgarh area (AQI consistently above 250)</li>
                <li>• Deploy additional traffic management during peak hours in Central Delhi</li>
                <li>• Consider emergency construction ban during high pollution days</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Connect ML forecasting server for real-time recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
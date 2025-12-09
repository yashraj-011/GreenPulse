// src/pages/AdminPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Shield,
  Settings,
  FileText,
  TrendingUp,
  Building2,
  Activity
} from 'lucide-react';

export default function AdminPanel() {
  const adminModules = [
    {
      title: "Policy Dashboard",
      description: "Monitor and manage air quality interventions and policies",
      icon: BarChart3,
      path: "/policy",
      color: "from-blue-500 to-blue-600",
      stats: "5 Active Policies"
    },
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: Users,
      path: "/admin/users",
      color: "from-green-500 to-green-600",
      stats: "1,234 Users"
    },
    {
      title: "System Monitoring",
      description: "Monitor system health, API status, and performance",
      icon: Activity,
      path: "/admin/monitoring",
      color: "from-purple-500 to-purple-600",
      stats: "All Systems Online"
    },
    {
      title: "Reports & Analytics",
      description: "Generate reports and view detailed analytics",
      icon: FileText,
      path: "/admin/reports",
      color: "from-orange-500 to-orange-600",
      stats: "24 Reports"
    },
    {
      title: "Station Management",
      description: "Manage monitoring stations and data sources",
      icon: Building2,
      path: "/admin/stations",
      color: "from-teal-500 to-teal-600",
      stats: "39 Stations"
    },
    {
      title: "System Settings",
      description: "Configure system settings and preferences",
      icon: Settings,
      path: "/admin/settings",
      color: "from-gray-500 to-gray-600",
      stats: "Settings"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Admin Panel</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-300">
          Administrative dashboard for managing the GreenPulse AQI monitoring system
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">1,234</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Active Policies</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">5</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Stations Online</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">37/40</p>
            </div>
            <Building2 className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">System Health</p>
              <p className="text-2xl font-bold text-green-600">Excellent</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Admin Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module, index) => {
          const Icon = module.icon;
          const isAvailable = module.path === "/policy";

          return (
            <div key={index} className="group relative">
              {isAvailable ? (
                <Link
                  to={module.path}
                  className="block bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {module.stats}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="block bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 opacity-60">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center mb-4 opacity-60`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {module.stats}
                    </span>
                    <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                      Coming Soon
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Admin Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-slate-900 dark:text-slate-50">Policy Dashboard accessed</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-slate-900 dark:text-slate-50">New user registered</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-slate-900 dark:text-slate-50">AQI data sync completed</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-blue-200 dark:border-slate-600">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/policy"
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">View Policy Dashboard</span>
          </Link>
          <button
            disabled
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg opacity-60 cursor-not-allowed"
          >
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Manage Users</span>
          </button>
          <button
            disabled
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg opacity-60 cursor-not-allowed"
          >
            <FileText className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
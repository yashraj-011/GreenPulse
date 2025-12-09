// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Eye
} from 'lucide-react';

// Use the same storage keys as Community component for data consistency
const LOCAL_PENDING_KEY = "community_pending_reports_v2";
const LOCAL_INCIDENTS_KEY = "community_public_incidents_v2";

export default function AdminPanel() {

  // Load reports from localStorage (same as Community component)
  const [pendingReports, setPendingReports] = useState(() => {
    const stored = localStorage.getItem(LOCAL_PENDING_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [verifiedReports, setVerifiedReports] = useState(() => {
    const stored = localStorage.getItem(LOCAL_INCIDENTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [selectedReport, setSelectedReport] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Persist data to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(pendingReports));
  }, [pendingReports]);

  useEffect(() => {
    localStorage.setItem(LOCAL_INCIDENTS_KEY, JSON.stringify(verifiedReports));
  }, [verifiedReports]);

  // Calculate statistics
  const totalReports = pendingReports.length + verifiedReports.length;
  const pendingCount = pendingReports.length;
  const verifiedCount = verifiedReports.length;

  // Handle report approval
  const handleApproveReport = (reportId) => {
    const report = pendingReports.find(r => r.id === reportId);
    if (!report) return;

    const approvedReport = {
      ...report,
      id: report.id,
      type: "Approved",
      time: "Just now"
    };

    setVerifiedReports(prev => [approvedReport, ...prev]);
    setPendingReports(prev => prev.filter(r => r.id !== reportId));
    setShowVerificationModal(false);
    setSelectedReport(null);
  };

  // Handle report rejection
  const handleRejectReport = (reportId) => {
    if (!window.confirm("Are you sure you want to reject this report?")) return;

    setPendingReports(prev => prev.filter(r => r.id !== reportId));
    setShowVerificationModal(false);
    setSelectedReport(null);
  };

  // Open verification modal
  const openVerificationModal = (report) => {
    setSelectedReport(report);
    setShowVerificationModal(true);
  };

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
      title: "Report Verification",
      description: "Review and verify pending community reports",
      icon: CheckCircle,
      path: "#verify-reports",
      color: "from-green-500 to-green-600",
      stats: `${pendingCount} Pending`,
      onClick: () => document.getElementById('verify-reports')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      title: "Verified Reports",
      description: "View all approved and published reports",
      icon: FileText,
      path: "#verified-reports",
      color: "from-purple-500 to-purple-600",
      stats: `${verifiedCount} Reports`,
      onClick: () => document.getElementById('verified-reports')?.scrollIntoView({ behavior: 'smooth' })
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Admin Dashboard</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-300">
          Comprehensive management dashboard for GreenPulse AQI monitoring system
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Reports</p>
              <p className="text-3xl font-bold">{totalReports}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Pending Reports</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </div>
            <Clock className="w-10 h-10 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Verified Reports</p>
              <p className="text-3xl font-bold">{verifiedCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Policies</p>
              <p className="text-3xl font-bold">5</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Admin Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {adminModules.map((module, index) => {
          const Icon = module.icon;

          if (module.onClick) {
            return (
              <button
                key={index}
                onClick={module.onClick}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-left"
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
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {module.stats}
                </div>
              </button>
            );
          }

          return (
            <Link
              key={index}
              to={module.path}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
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
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {module.stats}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Report Verification Section */}
      <div id="verify-reports" className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Pending Report Verification
          </h2>
          <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium">
            {pendingCount} Reports Awaiting Review
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {pendingReports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">All Clear!</h3>
              <p className="text-slate-600 dark:text-slate-300">No pending reports to review at this time.</p>
            </div>
          ) : (
            pendingReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">{report.author}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {report.location}
                      <span className="mx-1">•</span>
                      <Clock className="w-4 h-4" />
                      {report.time}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 truncate max-w-md">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openVerificationModal(report)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye size={14} />
                    Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verified Reports Section */}
      <div id="verified-reports" className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Verified Reports
          </h2>
          <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
            {verifiedCount} Reports Approved
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {verifiedReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">No Verified Reports</h3>
              <p className="text-slate-600 dark:text-slate-300">Approved reports will appear here.</p>
            </div>
          ) : (
            verifiedReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">{report.author}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {report.location}
                      <span className="mx-1">•</span>
                      <Clock className="w-4 h-4" />
                      {report.time}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 truncate max-w-md">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  Verified
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Report Verification</h2>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-50 text-lg">{selectedReport.author}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedReport.location}
                    <span className="mx-1">•</span>
                    <Clock className="w-4 h-4" />
                    {selectedReport.time}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">Report Description:</h3>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.image && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">Attached Image:</h3>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                    <img
                      src={selectedReport.image}
                      alt="Report evidence"
                      className="w-full max-h-64 object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleApproveReport(selectedReport.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex-1"
                >
                  <CheckCircle size={18} />
                  Approve Report
                </button>
                <button
                  onClick={() => handleRejectReport(selectedReport.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex-1"
                >
                  <XCircle size={18} />
                  Reject Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-blue-200 dark:border-slate-600">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/policy"
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Policy Dashboard</span>
          </Link>
          <button
            onClick={() => document.getElementById('verify-reports')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Verify Reports ({pendingCount})</span>
          </button>
          <button
            onClick={() => document.getElementById('verified-reports')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">View Reports ({verifiedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// src/components/AQICard.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from 'lucide-react';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function aqiStatus(aqi) {
  if (aqi == null) return { label: "Unknown", color: "#94A3B8", text: "—" };
  if (aqi <= 50) return { label: "Good", color: "#16a34a", text: "Good" };
  if (aqi <= 100) return { label: "Moderate", color: "#f59e0b", text: "Moderate" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#f97316", text: "Unhealthy" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#ef4444", text: "Very Unhealthy" };
  return { label: "Hazardous", color: "#7e22ce", text: "Hazardous" };
}

export default function AQICard({ station, onSearch, suggestions = [], loading = false }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const aqi = station && typeof station.aqi === "number" ? station.aqi : (station && parseInt(station.aqi, 10)) || 0;
  const pct = clamp((Math.min(aqi, 500) / 500) * 100, 0, 100);

  // Filter suggestions based on query
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0 && filteredSuggestions.length > 0);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    if (query.length > 0 && filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          selectSuggestion(filteredSuggestions[focusedIndex]);
        } else if (query.trim()) {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const selectSuggestion = (suggestion) => {
    setQuery(suggestion);
    setIsOpen(false);
    setFocusedIndex(-1);
    if (typeof onSearch === "function") {
      onSearch(suggestion);
    }
  };

  const size = 160;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const dashOffset = circumference - dash;

  const status = aqiStatus(aqi);

  const handleSearch = (e) => {
    e.preventDefault();
    if (typeof onSearch === "function") onSearch(query.trim());
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-6">
        {/* Gauge */}
        <div style={{ width: size }} className="flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={radius} stroke="#EFF6FF" className="dark:stroke-slate-600" strokeWidth={stroke} fill="none" strokeLinecap="round" />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={status.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.9,.2,1), stroke 300ms" }}
            />
            <circle cx={cx} cy={cy} r={radius - stroke - 4} fill="#ffffff" className="dark:fill-slate-700" />
            <g>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="700" fill="#0f172a" className="dark:fill-slate-50">
                {aqi}
              </text>
              <text x={cx} y={cy + 20} textAnchor="middle" fontSize="12" fill="#475569" className="dark:fill-slate-300">
                {status.label}
              </text>
            </g>
          </svg>
        </div>

        {/* Details + Search */}
        <div className="flex-1 min-w-0">
          {/* Station Info */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-300">Current AQI</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 leading-tight">{station?.name || "—"}</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-300 mt-1">{station?.category || ""}</p>
          </div>

          {/* Search input with custom dropdown */}
          <div className="mb-4 relative" ref={dropdownRef}>
            <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-md">
              <div className="relative flex-1 min-w-0">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Search location (Delhi)"
                  className="input px-3 py-2 pr-8 w-full"
                  aria-label="Search location"
                  autoComplete="off"
                />
                <ChevronDown
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />

                {/* Custom Dropdown */}
                {isOpen && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                          index === focusedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-slate-900 dark:text-slate-50'
                        } ${
                          index === 0 ? 'rounded-t-lg' : ''
                        } ${
                          index === filteredSuggestions.length - 1 ? 'rounded-b-lg' : ''
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary px-4 py-2 flex-shrink-0">
                Find
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm">
              <div className="text-xs text-slate-500 dark:text-slate-300">Category</div>
              <div className="font-semibold text-slate-800 dark:text-slate-50 mt-1">{station?.category || "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm">
              <div className="text-xs text-slate-500 dark:text-slate-300">Last updated</div>
              <div className="font-semibold text-slate-800 dark:text-slate-50 mt-1">Just now</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  MapPin,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ShieldCheck,
  Radio,
} from "lucide-react";

/**
 * Community.jsx
 * Improved, single-file React component for the Community page.
 * - Organized layout (left / center / right)
 * - Polished card styles that use existing Tailwind/utility classes
 * - Image upload saved to localStorage (data URL)
 * - Admin simulation, persistent storage keys
 * - Simple accessible interactions
 *
 * Drop into src/pages/Community.jsx
 */

const LOCAL_PENDING_KEY = "community_pending_reports_v2";
const LOCAL_INCIDENTS_KEY = "community_public_incidents_v2";

const demoIncidents = [
  {
    id: 101,
    author: "Ravi",
    location: "Anand Vihar ISBT",
    time: "15 min ago",
    description: "Heavy dust from nearby construction affecting bus stands.",
    type: "Dust",
    image: null,
  },
  {
    id: 102,
    author: "Sneha",
    location: "Ring Road, AIIMS",
    time: "45 min ago",
    description: "Slow-moving traffic, visible haze over the flyover.",
    type: "Traffic",
    image: null,
  },
];

const demoLocalUpdates = [
  { id: "u1", title: "Health", text: "AQI expected to stay 'Unhealthy' — limit outdoor workouts.", time: "Just now" },
  { id: "u2", title: "Station", text: "New monitor online near Dhaula Kuan — readings improving.", time: "1 hr" },
  { id: "u3", title: "Traffic", text: "Heavy congestion + visible dust at Ring Road, AIIMS.", time: "3 hr" },
  { id: "u4", title: "Policy", text: "Firecracker ban in effect this weekend in many zones.", time: "Yesterday" },
];

const initialLeaderboard = [
  { user: "Sneha", credits: 18 },
  { user: "Ravi", credits: 14 },
  { user: "Amit", credits: 10 },
  { user: "Priya", credits: 8 },
];

export default function Community({ user }) {
  // Determine if user is admin based on user prop
  const isAdmin = user?.role === 'admin';

  const [incidents, setIncidents] = useState(() => {
    const stored = localStorage.getItem(LOCAL_INCIDENTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return demoIncidents;
      }
    }
    return demoIncidents;
  });

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

  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [localUpdates] = useState(demoLocalUpdates);
  const [activeUpdateIndex, setActiveUpdateIndex] = useState(0);

  const [form, setForm] = useState({ location: "", description: "" });
  const [imagePreview, setImagePreview] = useState(null); // data URL
  const [imageData, setImageData] = useState(null); // data URL

  const fileRef = useRef(null);

  // rotate local updates
  useEffect(() => {
    const t = setInterval(() => {
      setActiveUpdateIndex((i) => (i + 1) % localUpdates.length);
    }, 6000);
    return () => clearInterval(t);
  }, [localUpdates.length]);

  // persist
  useEffect(() => {
    localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(pendingReports));
  }, [pendingReports]);

  useEffect(() => {
    localStorage.setItem(LOCAL_INCIDENTS_KEY, JSON.stringify(incidents));
  }, [incidents]);

  const currentUser = { name: "You", id: "me" };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageData(null);
      return;
    }

    // basic client-side size limit (2.5MB) and type check
    const maxMB = 2.5;
    if (file.size / (1024 * 1024) > maxMB) {
      alert(`Image too large — please pick under ${maxMB} MB.`);
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImagePreview(base64);
      setImageData(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { location, description } = form;
    if (!location.trim() || !description.trim()) {
      alert("Please enter location and a brief description.");
      return;
    }

    const newPending = {
      id: Date.now(),
      author: currentUser.name,
      location: location.trim(),
      description: description.trim(),
      time: "Just now",
      image: imageData || null,
    };

    setPendingReports((prev) => [newPending, ...prev]);
    setForm({ location: "", description: "" });
    setImagePreview(null);
    setImageData(null);
    if (fileRef.current) fileRef.current.value = null;
    // friendly feedback
    alert("Report submitted — pending moderator approval.");
  };

  const handleCancelPending = (id) => {
    if (!window.confirm("Cancel this pending report?")) return;
    setPendingReports((p) => p.filter((r) => r.id !== id));
  };

  const handleApprove = (id) => {
    const pending = pendingReports.find((p) => p.id === id);
    if (!pending) return;

    const approved = {
      id: pending.id,
      author: pending.author,
      location: pending.location,
      description: pending.description,
      time: "Just now",
      type: "User",
      image: pending.image || null,
    };

    setIncidents((prev) => [approved, ...prev]);
    setPendingReports((prev) => prev.filter((r) => r.id !== id));

    // award credits
    setLeaderboard((lb) => {
      const idx = lb.findIndex((x) => x.user === pending.author);
      if (idx >= 0) {
        const copy = [...lb];
        copy[idx] = { ...copy[idx], credits: copy[idx].credits + 5 };
        copy.sort((a, b) => b.credits - a.credits);
        return copy;
      }
      const copy = [{ user: pending.author, credits: 5 }, ...lb];
      copy.sort((a, b) => b.credits - a.credits);
      return copy;
    });
  };

  const handleReject = (id) => {
    if (!window.confirm("Reject this pending report?")) return;
    setPendingReports((p) => p.filter((r) => r.id !== id));
  };

  const myPending = pendingReports.filter((p) => p.author === currentUser.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck size={14} />
            {isAdmin ? "Admin Community Management" : "Citizen community watch"}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {isAdmin ? "Community Reports Management" : "Community Reporting"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            {isAdmin
              ? "Review and moderate community reports. Approve valid reports to make them public."
              : "Share on-ground incidents so others can plan safer commutes and outdoor time."
            }
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 px-4 py-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
            <Radio size={14} className="text-emerald-500 dark:text-emerald-400" />
            {isAdmin ? "Admin dashboard" : "Live citizen feed"}
          </div>
          {isAdmin && (
            <>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-600 text-white shadow-md">
                  Admin Mode
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Local updates news strip */}
      <div className="card-sky flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary-50 p-2 flex items-center justify-center" style={{ width: 48, height: 48 }}>
            <MapPin size={20} className="text-primary-600" />
          </div>
          <div>
            <div className="text-sm font-semibold dark:text-slate-50">Local Updates</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Latest local tips, notices and incoming reports</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative overflow-hidden" style={{ minHeight: 56 }}>
            <div style={{ transform: `translateY(${-activeUpdateIndex * 56}px)`, transition: "transform .45s" }}>
              {localUpdates.map((u) => (
                <div key={u.id} className="flex items-center justify-between" style={{ height: 56 }}>
                  <div className="text-sm text-slate-700 dark:text-slate-200">
                    <strong className="mr-2 text-xs text-slate-500 dark:text-slate-300">{u.title}:</strong>
                    <span className="line-clamp-2">{u.text}</span>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-400 ml-4">{u.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-400">Auto-updates</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {isAdmin ? (
          // Admin Layout: Pending Reports Management + Public Reports + Stats
          <>
            {/* Admin: Pending Reports Management (Full Width Top Priority) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Pending Reports Review
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">{pendingReports.length} reports awaiting review</div>
                    <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      Admin Review Required
                    </div>
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {pendingReports.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">All Clear!</h3>
                      <p className="text-slate-600 dark:text-slate-300">No pending reports to review at this time.</p>
                    </div>
                  ) : (
                    pendingReports.map((p) => (
                      <div key={p.id} className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-amber-200 dark:border-slate-600">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-50">{p.author}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {p.location}
                                <span className="mx-2">•</span>
                                <Clock className="w-4 h-4" />
                                {p.time}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Report Details:</h4>
                          <p className="text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg">
                            {p.description}
                          </p>
                        </div>

                        {p.image && (
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                            <img src={p.image} alt="Report evidence" className="w-full h-64 object-cover" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Admin: Public Reports Feed */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Published Community Reports</h3>
                  <div className="text-sm text-slate-500">{incidents.length} published reports</div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {incidents.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-slate-600 dark:text-slate-300">No published reports yet.</p>
                    </div>
                  ) : (
                    incidents.map((inc) => (
                      <div key={inc.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {inc.type || "Approved"}
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{inc.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={12} />
                            {inc.time}
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{inc.description}</p>
                        <div className="text-xs text-slate-500">
                          Reported by <strong>{inc.author}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Admin: Statistics and Leaderboard */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Admin Statistics</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingReports.length}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Pending Reviews</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{incidents.length}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Approved Reports</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{leaderboard.length}</div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Active Contributors</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Top Contributors</h3>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((l, idx) => (
                    <div key={l.user} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-50">{l.user}</div>
                          <div className="text-xs text-slate-500">Active reporter</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">{l.credits} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Regular User Layout: Report Form + Your Reports + Public Feed + Leaderboard
          <>
            {/* left: form + user's pending reports */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-4">
                <h2 className="text-sm font-semibold mb-2 dark:text-slate-50">Report an incident</h2>
                <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">Reports are reviewed before going public. Add a photo to make your report stronger.</p>

                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Location</label>
                    <input name="location" value={form.location} onChange={handleChange} className="input mt-1" placeholder="e.g. Dhaula Kuan flyover" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} className="input mt-1 h-28 resize-none" placeholder="Briefly describe what you are observing..." />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Photo (optional)</label>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-2xl text-sm dark:text-slate-200">
                        <ImageIcon size={16} />
                        <span>Add photo</span>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                      </label>
                      {imagePreview && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                          <img src={imagePreview} alt="preview" className="object-cover w-full h-full" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 mt-2">Max 2.5 MB. Photos stored locally only.</div>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">
                      <AlertTriangle size={16} />
                      Submit Report
                    </button>
                    <button type="button" onClick={() => { setForm({ location: "", description: "" }); setImagePreview(null); setImageData(null); if (fileRef.current) fileRef.current.value = null; }} className="btn-secondary">
                      Clear
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Your Pending Reports</h3>
                  <div className="text-xs text-slate-500">{myPending.length} pending</div>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {myPending.length === 0 ? (
                    <div className="text-sm text-slate-500">You have no pending reports. Use the form to report local incidents.</div>
                  ) : (
                    myPending.map((p) => (
                      <div key={p.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm">{p.location}</div>
                            <div className="text-xs text-slate-500">{p.time}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-xs text-amber-600 rounded-full px-2 py-1 bg-amber-50">Pending</div>
                            <button onClick={() => handleCancelPending(p.id)} className="text-xs text-red-600 flex items-center gap-1">
                              <XCircle size={14} /> Cancel
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-700 mb-2">{p.description}</p>

                        {p.image && (
                          <div className="rounded overflow-hidden border border-slate-200 mb-2">
                            <img src={p.image} alt="pending" className="object-cover w-full h-40" />
                          </div>
                        )}

                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <MapPin size={12} /> <span>{p.location}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* center: public feed */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Latest community reports</h3>
                  <div className="text-xs text-slate-500">{incidents.length} public</div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {incidents.length === 0 && <div className="text-sm text-slate-500">No public reports yet.</div>}

                  {incidents.map((inc) => (
                    <div key={inc.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{inc.type || "Report"}</span>
                          <div className="text-xs text-slate-500 ml-2">{inc.location}</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock size={12} />
                          <span>{inc.time}</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 mb-2">{inc.description}</p>

                      {inc.image && (
                        <div className="rounded overflow-hidden border border-slate-200 mb-2">
                          <img src={inc.image} alt="inc" className="object-cover w-full h-44" />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2"><MapPin size={12} /><span>{inc.location}</span></div>
                        <div>Submitted by <strong>{inc.author}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* right: leaderboard + help */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-4">
                <h3 className="text-sm font-semibold mb-3">AQI Hero Leaderboard</h3>
                <div className="space-y-3">
                  {leaderboard.map((l, idx) => (
                    <div key={l.user} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold">{idx + 1}</div>
                        <div>
                          <div className="font-medium">{l.user}</div>
                          <div className="text-xs text-slate-500">Reports approved</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">{l.credits} pts</div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400 mt-3">Users earn green credits when their reports are approved by moderators.</p>
              </div>

              <div className="card p-3 text-sm text-slate-600">
                <div className="font-semibold mb-1">How reporting works</div>
                <ul className="list-disc pl-4 text-xs">
                  <li>Reports are reviewed by moderators before going public.</li>
                  <li>Approved reports award credits to the reporter.</li>
                  <li>Use the form to share location & a short description.</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

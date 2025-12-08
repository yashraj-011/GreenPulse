// src/components/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

/*
  Advanced Profile page.
  - Tailwind-only styling (no extra files).
  - Avatar upload & localStorage persistence (key: aqi_avatar).
  - Redeem modal with validation (updates aqi_credits).
  - SVG circular progress ring.
  - Badges carousel + hover effects.
*/

function ProgressRing({ size = 84, stroke = 8, progress = 0.35 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  return (
    <svg width={size} height={size} className="block">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={radius} fill="#f8fafc" />
        <circle
          r={radius}
          stroke="#e6eef0"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          r={radius}
          stroke="url(#g1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          fill="transparent"
          transform="rotate(-90)"
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
        <text x="0" y="6" textAnchor="middle" className="text-xs font-semibold" style={{ fontSize: 12, fill: "#0f172a" }}>
          {Math.round(progress * 100)}%
        </text>
      </g>
    </svg>
  );
}

function Badge({ label }) {
  return (
    <div
      className="min-w-[110px] h-28 rounded-xl bg-white shadow-md flex flex-col items-center justify-center gap-2 p-3 transform transition-transform hover:-translate-y-1 hover:scale-[1.02]"
      title={label}
      role="img"
      aria-label={label}
    >
      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2L14.09 8.26L20.97 9.27L15.97 13.14L17.45 19.91L12 16.77L6.55 19.91L8.03 13.14L3.03 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>
      <div className="text-sm text-slate-800">{label}</div>
    </div>
  );
}

export default function Profile({ onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Demo User", role: "User" });
  const [credits, setCredits] = useState(175);
  const [steps, setSteps] = useState(5123);
  const [badges, setBadges] = useState(["Early Bird", "Walker", "Reporter"]);
  const [levelProgress, setLevelProgress] = useState(0.35);
  const [avatarDataUrl, setAvatarDataUrl] = useState(null);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name) setUser(parsed);
      }
      const profile = localStorage.getItem("aqi_user_profile");
      if (profile) {
        const p = JSON.parse(profile);
        if (p.name) setUser(prev => ({ ...prev, ...p }));
      }
      const c = localStorage.getItem("aqi_credits");
      if (c) setCredits(Number(c));
      const s = localStorage.getItem("aqi_steps");
      if (s) setSteps(Number(s));
      const b = localStorage.getItem("aqi_badges");
      if (b) {
        try { setBadges(JSON.parse(b)); } catch {}
      }
      const av = localStorage.getItem("aqi_avatar");
      if (av) setAvatarDataUrl(av);
      const lvl = localStorage.getItem("aqi_level_progress");
      if (lvl) setLevelProgress(Number(lvl));
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("aqi_credits", String(credits));
  }, [credits]);

  function handleLogout() {
    if (typeof onLogout === "function") { onLogout(); return; }
    localStorage.removeItem("user");
    navigate("/login");
  }

  function openFilePicker() {
    fileRef.current?.click();
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { alert("Please upload an image file"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      setAvatarDataUrl(res);
      try { localStorage.setItem("aqi_avatar", res); } catch {}
    };
    reader.readAsDataURL(f);
  }

  function clearAvatar() {
    setAvatarDataUrl(null);
    localStorage.removeItem("aqi_avatar");
  }

  function openRedeem() {
    setRedeemAmount("");
    setRedeemOpen(true);
  }

  function confirmRedeem() {
    const amt = Number(redeemAmount);
    if (!Number.isFinite(amt) || amt <= 0) { alert("Enter a valid redeem amount"); return; }
    if (amt > credits) { alert("Insufficient credits"); return; }
    // Demo: reduce credits and show success
    setCredits(prev => {
      const next = prev - amt;
      localStorage.setItem("aqi_credits", String(next));
      return next;
    });
    setRedeemOpen(false);
    // small success feedback
    setTimeout(() => alert(`Redeemed ${amt} credits (demo)`), 200);
  }

  const initials = (user.name || "DU").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();

  return (
    <div className="min-h-[72vh]">
      {/* Hero: animated soft gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-white to-sky-50 opacity-95 -z-10" />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 shadow-lg ring-8 ring-white transition-transform transform hover:scale-[1.03]">
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="absolute -bottom-1 -right-1 flex gap-2">
                <button
                  onClick={openFilePicker}
                  className="bg-white rounded-full p-1 shadow hover:scale-105 transition"
                  aria-label="Upload avatar"
                >
                  <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={clearAvatar}
                  className="bg-white rounded-full p-1 shadow hover:scale-105 transition"
                  aria-label="Clear avatar"
                >
                  <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <input ref={fileRef} onChange={handleFile} type="file" accept="image/*" className="hidden" />
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-extrabold text-slate-900">Hello, {user.name || "User"}!</h2>
              <p className="mt-1 text-sm text-slate-600 capitalize">Level 1 · {user.role || "Member"}</p>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <ProgressRing progress={levelProgress} />
                  <div>
                    <div className="text-xs text-slate-500">Progress to next level</div>
                    <div className="text-sm font-semibold text-slate-700">{Math.round(levelProgress * 100)}% complete</div>
                  </div>
                </div>

                <div className="ml-auto hidden sm:flex items-center gap-3">
                  <button onClick={() => alert("Profile edit not implemented")} className="bg-white py-2 px-3 rounded-lg shadow hover:scale-[1.02] transition">
                    Edit profile
                  </button>
                  <button onClick={() => alert("Share profile (demo)")} className="bg-white py-2 px-3 rounded-lg shadow hover:scale-[1.02] transition">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
            <div className="rounded-2xl p-5 shadow-lg bg-emerald-600 text-white flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium opacity-90">Green Credits</div>
                  <div className="mt-3 text-4xl font-extrabold tracking-tight">{credits}</div>
                </div>
                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <button onClick={() => openRedeem()} className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-semibold shadow hover:scale-[1.02] transition">
                  Redeem
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5 shadow-lg bg-white text-slate-900 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-600">Steps</div>
                  <div className="mt-3 text-4xl font-extrabold tracking-tight">{steps}</div>
                  <div className="mt-2 text-sm text-slate-500">Last sync: today</div>
                </div>
                <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-400" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12h4M7 6h4M11 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="18" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-6xl mx-auto px-6 -mt-6">
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">My Badges</h3>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {badges.map((b, i) => <Badge key={i} label={b} />)}
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Reports Submitted</h3>
          <div className="rounded-2xl bg-white shadow-md p-4 text-slate-600 max-w-3xl">
            You have submitted reports — open Community to view them.
          </div>
        </section>

        <div className="flex justify-center mb-12">
          <button onClick={handleLogout} className="text-red-600 font-semibold hover:underline">
            Logout
          </button>
        </div>
      </div>

      {/* Redeem modal */}
      {redeemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-semibold mb-3">Redeem credits</h4>
            <p className="text-sm text-slate-600 mb-4">Enter amount to redeem. (Demo — no real transfer.)</p>
            <input
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              type="number"
              min="1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4"
              placeholder="Amount to redeem"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRedeemOpen(false)} className="py-2 px-3 rounded-lg">Cancel</button>
              <button onClick={confirmRedeem} className="py-2 px-4 rounded-lg bg-emerald-600 text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

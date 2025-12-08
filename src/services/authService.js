// src/services/authService.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  getIdToken,
  signOut,
} from "firebase/auth";

/* DEBUG: show loaded env (keep while developing) */
console.log("🔥 Loaded Firebase ENV:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const BACKEND = import.meta.env.VITE_API_BASE || "";

async function exchangeFirebaseToken(idToken, role) {
  console.log("🔥 Sending token to backend:", BACKEND);
  const res = await fetch(`${BACKEND}/api/auth/firebase-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, role }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("🔥 Backend login failed:", res.status, text);
    // try to parse JSON error if available
    try {
      const json = await res.json();
      throw new Error(json?.message || json?.detail || `Backend error ${res.status}`);
    } catch {
      throw new Error(text || `Backend error ${res.status}`);
    }
  }

  return res.json(); // expects { token, user }
}

export const authService = {
  /**
   * Signup flow:
   * - create Firebase account
   * - set displayName
   * - exchange idToken with backend
   * - fallback: if email already exists, try sign-in with same password (dev-friendly)
   */
  signup: async ({ name, email, password, role = "user" }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });

      const idToken = await getIdToken(cred.user, true);
      const payload = await exchangeFirebaseToken(idToken, role);

      if (payload?.token) localStorage.setItem("backend_token", payload.token);
      return payload;
    } catch (err) {
      // dev-friendly fallback: if email already exists, try sign-in
      const code = err?.code || err?.message || "";

      if (code.includes("auth/email-already-in-use")) {
        console.warn("⚠️ signup: email already in use — attempting sign-in fallback");
        try {
          const signInCred = await signInWithEmailAndPassword(auth, email, password);
          const idToken = await getIdToken(signInCred.user, true);
          const payload = await exchangeFirebaseToken(idToken, role);
          if (payload?.token) localStorage.setItem("backend_token", payload.token);
          return payload;
        } catch (signInErr) {
          console.error("🔥 signup fallback signIn failed:", signInErr);
          throw new Error("Email already in use. Tried to sign in but failed. Please login or reset password.");
        }
      }

      console.error("🔥 FIREBASE SIGNUP ERROR:", err);
      throw err;
    }
  },

  /**
   * Login flow:
   * - sign in to Firebase
   * - exchange idToken with backend
   */
  login: async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await getIdToken(cred.user, true);

      const payload = await exchangeFirebaseToken(idToken);
      if (payload?.token) localStorage.setItem("backend_token", payload.token);
      return payload;
    } catch (err) {
      console.error("🔥 FIREBASE LOGIN ERROR:", err);
      throw err;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("⚠️ signOut failed:", e);
    }
    localStorage.removeItem("backend_token");
  },

  getBackendToken: () => localStorage.getItem("backend_token"),

  authHeader: () => {
    const t = localStorage.getItem("backend_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  },

  /**
   * Helper: create a report (uses stored backend JWT)
   * data = { title, description, city, stationName }
   */
  createReport: async (data) => {
    const headers = {
      "Content-Type": "application/json",
      ...authService.authHeader(),
    };
    const res = await fetch(`${BACKEND}/api/reports`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("🔥 createReport failed:", res.status, text);
      throw new Error(text || `createReport failed ${res.status}`);
    }
    return res.json();
  },
};

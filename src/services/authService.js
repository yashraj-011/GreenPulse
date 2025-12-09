// src/services/authService.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
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

export const authService = {
  /**
   * Signup flow:
   * - create Firebase account
   * - set displayName
   * - create local user object with role (no backend required)
   */
  signup: async ({ name, email, password, role = "user" }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });

      // Create user object with role (local-only, no backend)
      const user = {
        name: name || cred.user.displayName || email.split('@')[0],
        email: cred.user.email,
        role: role,
        uid: cred.user.uid
      };

      const payload = { user, token: `local_token_${Date.now()}` };
      localStorage.setItem("backend_token", payload.token);

      console.log("✅ Created user:", user);
      return payload;
    } catch (err) {
      // dev-friendly fallback: if email already exists, try sign-in
      const code = err?.code || err?.message || "";

      if (code.includes("auth/email-already-in-use")) {
        console.warn("⚠️ signup: email already in use — attempting sign-in fallback");
        try {
          const signInCred = await signInWithEmailAndPassword(auth, email, password);

          // Create user object with role for existing user
          const user = {
            name: name || signInCred.user.displayName || email.split('@')[0],
            email: signInCred.user.email,
            role: role,
            uid: signInCred.user.uid
          };

          const payload = { user, token: `local_token_${Date.now()}` };
          localStorage.setItem("backend_token", payload.token);

          console.log("✅ Signed in existing user:", user);
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
   * - create local user object with role (no backend required)
   */
  login: async (email, password, role = "user") => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Create user object with role (local-only, no backend)
      const user = {
        name: cred.user.displayName || email.split('@')[0],
        email: cred.user.email,
        role: role,
        uid: cred.user.uid
      };

      const payload = { user, token: `local_token_${Date.now()}` };
      localStorage.setItem("backend_token", payload.token);

      console.log("✅ Logged in user:", user);
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

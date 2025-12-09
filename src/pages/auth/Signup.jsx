import React, { useState } from "react";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";

const Signup = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = await authService.signup(form);
      onSuccess(payload.user);
      toast.success("Account created");
    } catch {
      toast.error("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-1 text-slate-900">
          Create account
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label>Full name</label>
            <input
              className="input mt-1"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              className="input mt-1"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Password</label>
            <input
              className="input mt-1"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
            <select
              className="input mt-1"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="user">👤 User Account</option>
              <option value="admin">🛡️ Administrator Account</option>
            </select>
            {form.role === 'admin' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                ⚠️ Admin accounts have elevated privileges for system management
              </p>
            )}
          </div>

          <button className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;

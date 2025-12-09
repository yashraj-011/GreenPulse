import React, { useState } from "react";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";

const Login = ({ onSuccess }) => {
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = await authService.login(form.email, form.password, form.role);
      onSuccess(payload.user);
      toast.success("Logged in");
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-1 text-slate-900">Welcome back</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Login as</label>
            <select
              className="input mt-1"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="user">👤 User</option>
              <option value="admin">🛡️ Administrator</option>
            </select>
            {form.role === 'admin' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                ⚠️ Admin access provides elevated privileges including policy management
              </p>
            )}
          </div>

          <button className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          New here? <a href="/signup">Create an account</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

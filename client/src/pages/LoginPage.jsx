import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const profile = await login(email, password);
      toast.success(`Welcome back, ${profile.name}`);
      navigate(profile.role === "manager" ? "/manager" : "/storekeeper");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (!err.response
          ? "Cannot connect to the server. Please try again shortly."
          : err.response.status >= 500
            ? "The sign-in service is unavailable. Please try again shortly."
            : "Unable to sign in. Please try again.")
      );
    }
  };

  return (
    <div className="min-h-screen bg-graphite-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-4xl tracking-wide text-amber">NIMS</p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50 mt-2">
            NANCE Inventory Management System
          </p>
        </div>

        <div className="bg-paper rounded-md shadow-xl p-7">
          <h1 className="font-display text-xl font-semibold text-graphite-900 mb-1">
            Sign in
          </h1>
          <p className="text-sm text-graphite-600 mb-6">
            Enter your credentials to reach your dashboard.
          </p>

          {error && (
            <div className="text-sm text-rejected bg-rejected/10 border border-rejected/20 rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-graphite-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none bg-white"
                placeholder="you@nance.com"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-graphite-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none bg-white"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium rounded-md bg-graphite-900 text-white hover:bg-graphite-800 disabled:opacity-60 mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6 font-mono">
          Access is provisioned by your manager. Contact them for an account.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

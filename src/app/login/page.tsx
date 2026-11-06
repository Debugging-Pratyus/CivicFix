"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#07111f] px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-3xl">
            🏙️
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Civic<span className="text-cyan-400">Fix</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Civic Administration Portal
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101e30] p-8 shadow-2xl">
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to access the administration dashboard.
          </p>

          <form onSubmit={handleLogin} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@civicfix.in"
                className="w-full rounded-xl border border-slate-700 bg-[#091525] px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-700 bg-[#091525] px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-[#07111f] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to dashboard →"}
            </button>
          </form>

          <div className="mt-7 border-t border-white/10 pt-5 text-center">
            <p className="text-xs text-slate-500">
              Authorized civic administrators only
            </p>
            <p className="mt-2 text-xs text-slate-600">
              CivicFix · Smart Municipal Complaint Management
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © 2026 CivicFix
        </p>
      </div>
    </main>
  );
}

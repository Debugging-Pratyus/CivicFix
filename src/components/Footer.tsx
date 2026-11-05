import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, MapPin, Sparkles, Activity } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-[#0b152b] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Civic<span className="text-cyan-400">Fix</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Transforming everyday citizen complaints into actionable, trackable, and prioritized civic resolutions with Google Gemini AI.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CivicFix Core Engine Active · HackFest 2026</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Supported Domains
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>🛣️ Roads & Hazard Potholes</li>
              <li>🗑️ Waste Accumulation</li>
              <li>💡 Damaged Streetlights</li>
              <li>🌊 Blocked Drains & Inundation</li>
              <li>🚰 Municipal Water Leakages</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Platform Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-cyan-300 transition">
                  Overview & Homepage
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-cyan-300 transition">
                  Submit a Complaint
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-cyan-300 transition">
                  Track Resolution Status
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-300 transition">
                  Administrator Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Transparency Standards
            </h4>
            <p className="text-xs leading-relaxed text-slate-300 mb-3">
              CivicFix scores complaints with an explainable 5-factor priority formula (Safety 30%, People 25%, Recurrence 20%, SLA 15%, Evidence 10%).
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-cyan-200">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero Silent Rejections</span>
              </div>
              Incomplete reports are flagged for review rather than dropped.
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 CivicFix Platform. Built for civic transparency & rapid municipal triage.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for HackFest 2026
          </p>
        </div>
      </div>
    </footer>
  );
};

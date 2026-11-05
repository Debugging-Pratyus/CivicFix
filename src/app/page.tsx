"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ComplaintForm } from "@/components/ComplaintForm";
import { CATEGORIES_META } from "@/lib/constants";
import { getCategoryIcon } from "@/components/CategoryBadge";
import type { ComplaintCategory } from "@/types";
import {
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  BarChart3,
  GitMerge,
  CheckCircle,
  AlertCircle,
  Layers,
  MapPin,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [quickTrackId, setQuickTrackId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | undefined>(undefined);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      router.push(`/track?id=${encodeURIComponent(quickTrackId.trim())}`);
    }
  };

  const handleSelectCategoryForReport = (cat: ComplaintCategory) => {
    setSelectedCategory(cat);
    const element = document.getElementById("report-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const steps = [
    {
      step: "01",
      title: "Citizen Submission",
      desc: "Report issues in 60 seconds with simple descriptions, landmarks, and photo evidence.",
      badge: "Instant Filing",
      icon: MapPin,
    },
    {
      step: "02",
      title: "Gemini AI Classification",
      desc: "Extracts key location clues, categorises problems into 5 domains, and flags missing info.",
      badge: "Intelligent Triage",
      icon: Sparkles,
    },
    {
      step: "03",
      title: "Transparent Scoring (0–100)",
      desc: "Computes urgency via 5 explainable weights: safety (30%), public impact (25%), recurrence (20%), SLA (15%), evidence (10%).",
      badge: "Zero Bias",
      icon: BarChart3,
    },
    {
      step: "04",
      title: "SLA Resolution & Tracking",
      desc: "Strict category deadlines guarantee civic accountability with real-time tracking for citizens.",
      badge: "Full Accountability",
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b152b] via-[#101e3b] to-[#0f1d38] text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Ambient Glows */}
        <div className="absolute -right-36 -top-36 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-36 top-1/2 h-[450px] w-[450px] rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Col: Hero Pitch */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Next-Gen Municipal Complaint Platform · HackFest 2026</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                Fix civic problems. <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                  Faster, smarter & verified.
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-300">
                CivicFix transforms chaotic complaints into organised, SLA-monitored civic issues. Powered by Google Gemini AI triage, transparent 5-factor priority scoring, and duplicate detection.
              </p>

              {/* Quick Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href="#report-section"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 active:scale-98"
                >
                  <span>Report an Issue Now</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10 active:scale-98"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Explore Admin Console</span>
                </Link>
              </div>

              {/* Quick Tracking Search Bar */}
              <div className="pt-4 max-w-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Already have a complaint tracking ID?
                </p>
                <form onSubmit={handleQuickTrack} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. CF-2026-A1B2C3D4"
                      value={quickTrackId}
                      onChange={(e) => setQuickTrackId(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-slate-400 focus:bg-white/15 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 font-mono uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 cursor-pointer"
                  >
                    Track
                  </button>
                </form>
              </div>

              {/* Stat badges */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg">
                <div>
                  <div className="text-2xl font-black text-white">5 Domains</div>
                  <div className="text-xs text-slate-400">Potholes to Water</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-cyan-300">0–100</div>
                  <div className="text-xs text-slate-400">Explainable Priority</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">&lt; 2s</div>
                  <div className="text-xs text-slate-400">AI Triage Speed</div>
                </div>
              </div>
            </div>

            {/* Right Col: Live AI Triage Card Simulation */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-cyan-200">
                      LIVE AI TRIAGE PIPELINE
                    </span>
                  </div>
                  <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 font-mono text-[11px] font-semibold text-blue-300">
                    CF-2026-DEMO
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Incoming report card */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Incoming Citizen Report
                    </span>
                    <h4 className="mt-1 text-sm font-semibold text-white">
                      &quot;Burst water main flooding Ward 8 junction&quot;
                    </h4>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                      High-pressure potable water gushing across main road, impacting 200+ homes and creating hazardous traffic stagnation.
                    </p>
                  </div>

                  {/* Classification Breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3.5">
                      <span className="text-[10px] font-semibold text-blue-300 uppercase">
                        AI Classification
                      </span>
                      <p className="mt-1 font-bold text-white text-sm">Water Leakage</p>
                      <p className="text-[10px] text-blue-200 mt-0.5">Confidence: 96%</p>
                    </div>

                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3.5">
                      <span className="text-[10px] font-semibold text-rose-300 uppercase">
                        Priority Engine
                      </span>
                      <p className="mt-1 font-bold text-rose-200 text-sm">88 / 100 (Critical)</p>
                      <p className="text-[10px] text-rose-300/80 mt-0.5">SLA Target: 6 Hours</p>
                    </div>
                  </div>

                  {/* Priority Factor Breakdown Bar */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-semibold text-white">5-Factor Score Calculation</span>
                      <span className="font-mono text-cyan-300">88 pts</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 h-2 rounded-full overflow-hidden bg-white/10 p-0.5">
                      <div className="bg-rose-500 rounded-sm" title="Safety: 28/30" />
                      <div className="bg-amber-500 rounded-sm" title="People Affected: 23/25" />
                      <div className="bg-blue-500 rounded-sm" title="Recurrence: 16/20" />
                      <div className="bg-purple-500 rounded-sm" title="SLA Pressure: 13/15" />
                      <div className="bg-emerald-500 rounded-sm" title="Confidence: 8/10" />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Safety (30%)</span>
                      <span>Impact (25%)</span>
                      <span>Hist (20%)</span>
                      <span>SLA (15%)</span>
                      <span>Conf (10%)</span>
                    </div>
                  </div>

                  {/* Status Progress */}
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-950/30 p-3 flex items-center justify-between text-xs">
                    <span className="text-cyan-200">Municipal Dispatch Status</span>
                    <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 font-semibold text-cyan-300">
                      Field Crew Dispatched
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Five Supported Categories Section ────────────────────────────── */}
      <section id="categories" className="py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
              Civic Scope & Coverage
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Five Dedicated Municipal Categories
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              CivicFix is tailored for high-frequency civic issues that impact everyday neighbourhood safety, mobility, and sanitation.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {(Object.keys(CATEGORIES_META) as ComplaintCategory[]).map((catKey) => {
              const meta = CATEGORIES_META[catKey];
              return (
                <div
                  key={catKey}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition">
                        {getCategoryIcon(catKey, "w-6 h-6 text-slate-700 group-hover:text-blue-600 transition")}
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        SLA: {meta.slaTargetHours}h
                      </span>
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {meta.label}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {meta.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectCategoryForReport(catKey)}
                    className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 cursor-pointer"
                  >
                    <span>Report This</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-800">
              The Workflow
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How CivicFix Resolves Complaints
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              A transparent, closed-loop civic process designed for citizens and municipal administrators alike.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-2xl font-black text-blue-600">
                        {s.step}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                        {s.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main Reporting Form Section ──────────────────────────────────── */}
      <section id="report-section" className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ComplaintForm initialCategory={selectedCategory} />
        </div>
      </section>

      {/* ── Key Technology Highlights ────────────────────────────────────── */}
      <section className="py-20 bg-[#101e3b] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Transparent Civic Architecture
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Built to eliminate black-box decision making.
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed text-sm sm:text-base">
                Civic problems shouldn&apos;t disappear into opaque municipal spreadsheets. CivicFix uses structured rules and verifiable factor breakdowns.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-300">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Zero Silent Rejections</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Incomplete or ambiguous reports are flagged for citizen clarification, never dropped.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-300">
                    <GitMerge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Smart Duplicate Suggestions</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Similar citizen reports are grouped with similarity confidence scores, preserving every citizen&apos;s individual tracking ID.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Category-Specific SLA Deadlines</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Critical water leaks (6h), road hazards (24h-48h), and streetlights (48h) ensure measurable response times.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Explainable Formula Card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <span>Explainable Priority Formula</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 mb-6">
                Total Priority Score = Sum of 5 Weighted Municipal Criteria (Max 100)
              </p>

              <div className="space-y-4">
                {[
                  { label: "1. Safety & Hazard Severity", weight: "30%", color: "bg-rose-500", desc: "Life risks, traffic collision danger, structural cave-ins" },
                  { label: "2. Commuter / Citizen Impact", weight: "25%", color: "bg-amber-500", desc: "Estimated population and commuter density affected" },
                  { label: "3. Recurrence & Area History", weight: "20%", color: "bg-blue-500", desc: "Previous unresolved complaints in the same zone" },
                  { label: "4. SLA Deadline Escalation", weight: "15%", color: "bg-purple-500", desc: "Pressure rises automatically as resolution deadline approaches" },
                  { label: "5. Evidence Quality & Confidence", weight: "10%", color: "bg-emerald-500", desc: "Photo clarity, landmark precision, and GPS verification" },
                ].map((item) => (
                  <div key={item.label} className="border-b border-white/10 pb-3">
                    <div className="flex justify-between items-center text-sm font-semibold text-white mb-1">
                      <span>{item.label}</span>
                      <span className="font-mono text-cyan-300">{item.weight}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

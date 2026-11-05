"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import type { Complaint, StatusHistory, SlaRecord, PriorityBreakdown } from "@/types";
import {
  Search,
  Copy,
  Check,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  ShieldAlert,
  Loader2,
  FileText,
  Activity,
  Sparkles,
} from "lucide-react";

interface ComplaintDetail extends Complaint {
  status_history?: StatusHistory[];
  sla_records?: SlaRecord | SlaRecord[];
}

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("id") || "";

  const [trackingIdInput, setTrackingIdInput] = useState(initialId);
  const [activeTrackingId, setActiveTrackingId] = useState(initialId);
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync if URL query param changes
  useEffect(() => {
    if (initialId && initialId !== activeTrackingId) {
      setTrackingIdInput(initialId);
      setActiveTrackingId(initialId);
    }
  }, [initialId]);

  // Fetch complaint details
  useEffect(() => {
    if (!activeTrackingId.trim()) {
      setComplaint(null);
      setFetchError(null);
      return;
    }

    const fetchComplaint = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/complaints/${encodeURIComponent(activeTrackingId.trim())}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "No complaint found with this ID.");
        }

        setComplaint(json.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unable to load complaint details.";
        setFetchError(msg);
        setComplaint(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaint();
  }, [activeTrackingId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingIdInput.trim()) return;
    const cleanId = trackingIdInput.trim();
    setActiveTrackingId(cleanId);
    router.push(`/track?id=${encodeURIComponent(cleanId)}`);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract SLA record (can be array or single object)
  const slaRecord: SlaRecord | undefined = Array.isArray(complaint?.sla_records)
    ? complaint?.sla_records[0]
    : (complaint?.sla_records as SlaRecord | undefined);

  // Parse breakdown
  const priorityBreakdown = complaint?.priority_breakdown as PriorityBreakdown | null;

  return (
    <div className="space-y-8">
      {/* ── Search Bar Hero ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs text-center">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
          Real-Time Resolution Tracker
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Civic Complaint
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-lg mx-auto">
          Enter your unique tracking ID (format: CF-2026-XXXXXXXX) to inspect triage status, priority score, and SLA deadlines.
        </p>

        <form onSubmit={handleSearch} className="mt-6 max-w-xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Enter CF-2026-XXXXXXXX or UUID"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !trackingIdInput.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </form>
      </div>

      {/* ── Loading Skeleton ───────────────────────────────────────────── */}
      {isLoading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-600">Retrieving municipal record & SLA timelines...</p>
        </div>
      )}

      {/* ── Error / Not Found ──────────────────────────────────────────── */}
      {!isLoading && fetchError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center max-w-xl mx-auto space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-rose-900 text-lg">Complaint Not Found</h3>
          <p className="text-sm text-rose-700">
            We couldn&apos;t find a record matching &quot;{activeTrackingId}&quot;. Please verify your tracking ID or submit a new complaint.
          </p>
          <div className="pt-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              <span>Submit a New Complaint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Empty Initial State (when no search yet) ──────────────────── */}
      {!isLoading && !complaint && !fetchError && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Tracking ID Entered</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            When citizens file a problem through CivicFix, a unique tracking ID is generated to provide full visibility into SLA resolution.
          </p>
          <div className="pt-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              <span>File Your First Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Live Complaint Details Card ────────────────────────────────── */}
      {!isLoading && complaint && (
        <div className="space-y-6">
          {/* Main Top Header Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tracking ID
                  </span>
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-0.5 font-mono text-sm font-bold text-blue-800">
                    <span>{complaint.tracking_id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(complaint.tracking_id)}
                      className="text-blue-600 hover:text-blue-800 transition"
                      title="Copy ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {complaint.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={complaint.status} size="lg" />
                <CategoryBadge category={complaint.category} size="lg" />
              </div>
            </div>

            {/* Sub-meta Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Submitted On
                </span>
                <p className="mt-1 font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>
                    {new Date(complaint.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Priority Rating
                </span>
                <div className="mt-1">
                  <PriorityBadge score={complaint.priority_score} size="md" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  SLA Target Window
                </span>
                <p className="mt-1 font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{slaRecord ? `${slaRecord.deadline_hours} Hours` : "Under Triage"}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  SLA Due Date
                </span>
                <p className="mt-1 font-semibold text-sm flex items-center gap-1.5">
                  {slaRecord?.is_overdue ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Overdue</span>
                    </span>
                  ) : slaRecord?.deadline_at ? (
                    <span className="text-slate-800">
                      {new Date(slaRecord.deadline_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-500">Calculating...</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Missing Info Clarification Banner (if flagged) */}
          {complaint.requires_clarification && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  Clarification or Additional Information Recommended
                </h4>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  The AI triage engine flagged that some details may assist field workers:{" "}
                  <span className="font-semibold">
                    {complaint.missing_info_flags?.length
                      ? complaint.missing_info_flags.join(", ")
                      : "Specific landmarks or street numbers are recommended."}
                  </span>
                  . The complaint is still queued for municipal review.
                </p>
              </div>
            </div>
          )}

          {/* Two-Column Layout: Details + Priority Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Description, Location, Photo */}
            <div className="lg:col-span-7 space-y-6">
              {/* Description Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Citizen Description</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {complaint.description}
                </p>

                {/* Location Box */}
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Reported Location
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {complaint.location_text || "Location not specified"}
                      </p>
                    </div>
                  </div>

                  {complaint.landmark_clues && (
                    <div className="text-xs text-slate-600 pl-6">
                      <span className="font-semibold text-slate-700">Landmarks: </span>
                      {complaint.landmark_clues}
                    </div>
                  )}

                  {complaint.latitude && complaint.longitude && (
                    <div className="text-[11px] font-mono text-slate-500 pl-6">
                      GPS: {complaint.latitude}, {complaint.longitude}
                    </div>
                  )}
                </div>

                {/* Attached Photo Evidence */}
                {complaint.image_urls && complaint.image_urls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photo Evidence</span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {complaint.image_urls.map((img, i) => (
                        <a
                          key={i}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block w-36 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs hover:border-blue-400 transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Complaint evidence ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status History Timeline */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Resolution Timeline & Updates</h3>
                </div>

                {complaint.status_history && complaint.status_history.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {complaint.status_history.map((hist, idx) => (
                      <div key={hist.id || idx} className="relative">
                        <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                              Status Changed:
                            </span>
                            <StatusBadge status={hist.to_status} size="sm" />
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(hist.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {hist.notes && (
                            <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {hist.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Complaint registered. Status updates will be logged here as municipal teams inspect the issue.
                  </p>
                )}
              </div>
            </div>

            {/* Right 5 cols: Priority Engine Factor Breakdown */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Priority Engine</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {complaint.priority_score ?? 0} / 100
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  CivicFix prioritises issues transparently based on 5 objective factors.
                </p>

                {priorityBreakdown ? (
                  <PriorityBadge
                    score={complaint.priority_score}
                    breakdown={priorityBreakdown}
                    showBreakdown={true}
                    size="lg"
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    Priority breakdown details available upon final triage.
                  </div>
                )}
              </div>

              {/* AI Reasoning card if raw AI output exists */}
              {complaint.ai_classification_raw && (
                <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Gemini AI Triage Assessment</span>
                  </div>
                  <p className="text-xs leading-relaxed text-blue-950">
                    {typeof (complaint.ai_classification_raw as Record<string, unknown>).reasoning === "string"
                      ? ((complaint.ai_classification_raw as Record<string, unknown>).reasoning as string)
                      : "Issue automatically classified into municipal domain with initial risk parameters."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Suspense
            fallback={
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-3 text-sm text-slate-500">Loading complaint tracker...</p>
              </div>
            }
          >
            <TrackContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

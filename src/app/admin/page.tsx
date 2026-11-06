"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { CATEGORIES_META, STATUS_META } from "@/lib/constants";
import type {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  DuplicateSuggestion,
  SlaRecord,
} from "@/types";
import {
  LayoutDashboard,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GitMerge,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  FileEdit,
  Flame,
  Activity,
  Layers,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";

interface AdminComplaint extends Complaint {
  sla_records?: SlaRecord | SlaRecord[];
}

interface DuplicateItem extends DuplicateSuggestion {
  source?: {
    id: string;
    tracking_id: string;
    title: string;
    category: ComplaintCategory;
    status: ComplaintStatus;
  };
  target?: {
    id: string;
    tracking_id: string;
    title: string;
    category: ComplaintCategory;
    status: ComplaintStatus;
  };
}

export default function AdminPage() {

    const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };
  // Navigation tab: "complaints" | "duplicates"
  const [activeTab, setActiveTab] = useState<"complaints" | "duplicates">("complaints");

  // Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"created_at" | "priority_score" | "updated_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Data state
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicates state
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [duplicateActionLoading, setDuplicateActionLoading] = useState<string | null>(null);

  // Status Update Modal state
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("in_progress");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  // ── Fetch Complaints ───────────────────────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("sort_by", sortBy);
      params.set("sort_dir", sortDir);
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/admin/complaints?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load complaints");
      }

      setComplaints(json.data || []);
      if (json.pagination) {
        setTotalCount(json.pagination.total);
        setTotalPages(json.pagination.total_pages || 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching complaints";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, limit, sortBy, sortDir, search, statusFilter, categoryFilter]);

  // ── Fetch Duplicates ───────────────────────────────────────────────────────
  const fetchDuplicates = useCallback(async () => {
    setIsLoadingDuplicates(true);
    try {
      const res = await fetch("/api/admin/duplicates");
      const json = await res.json();
      if (res.ok && json.success) {
        setDuplicates(json.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch duplicates:", err);
    } finally {
      setIsLoadingDuplicates(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    if (activeTab === "duplicates") {
      fetchDuplicates();
    }
  }, [activeTab, fetchDuplicates]);

  // ── Handle Status Update ───────────────────────────────────────────────────
  const handleOpenStatusModal = (c: AdminComplaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setStatusNotes("");
    setStatusUpdateSuccess(false);
    setStatusUpdateError(null);
  };

  const handleSubmitStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdatingStatus(true);
    setStatusUpdateError(null);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update status");
      }

      setStatusUpdateSuccess(true);
      setTimeout(() => {
        setSelectedComplaint(null);
        fetchComplaints();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      setStatusUpdateError(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ── Handle Duplicate Confirmation / Rejection ──────────────────────────────
  const handleDuplicateReview = async (id: string, action: "confirm" | "reject") => {
    setDuplicateActionLoading(id);
    try {
      const suggestion = duplicates.find((d) => d.id === id);
      const masterIssueId =
        action === "confirm"
          ? suggestion?.master_issue_id || suggestion?.target_complaint_id || undefined
          : undefined;

      const res = await fetch("/api/admin/duplicates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          master_issue_id: masterIssueId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process duplicate review");
      }

      // Refresh both
      fetchDuplicates();
      fetchComplaints();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to review duplicate");
    } finally {
      setDuplicateActionLoading(null);
    }
  };

  // Calculate live metric badges from loaded complaints
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "in_progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;
  const overdueCount = complaints.filter((c) => {
    const sla = Array.isArray(c.sla_records) ? c.sla_records[0] : c.sla_records;
    return c.status === "overdue" || sla?.is_overdue;
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* ── Top Bar ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Municipal Operations Console
                </h1>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Triage incoming complaints, track field SLA deadlines, update resolution statuses, and review duplicate suggestions.
              </p>
            </div>

            <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
              <button
                type="button"
                onClick={() => {
                  setIsRefreshing(true);
                  fetchComplaints();
                  if (activeTab === "duplicates") fetchDuplicates();
                }}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
                <span>Refresh Data</span>
              </button>

              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
              >
                <span>+ Log Complaint</span>
              </Link>
            </div>
          </div>

          {/* ── Metric KPI Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Complaints
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{totalCount}</span>
                <span className="text-xs text-slate-500 font-medium">Logged</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Triage
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-700">{pendingCount}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Awaiting
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                In Progress
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-700">{inProgressCount}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Dispatched
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                Resolved
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700">{resolvedCount}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Closed
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                SLA Overdue
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-700">{overdueCount}</span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  Escalated
                </span>
              </div>
            </div>
          </div>

          {/* ── Tabs Selector ────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("complaints")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === "complaints"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Complaints Database</span>
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("duplicates")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === "duplicates"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <GitMerge className="w-4 h-4" />
              <span>Duplicate Review Queue</span>
              {duplicates.length > 0 && (
                <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 animate-pulse">
                  {duplicates.length}
                </span>
              )}
            </button>
          </div>

          {/* ── TAB 1: Complaints List & Filters ─────────────────────────── */}
          {activeTab === "complaints" && (
            <div className="space-y-4">
              {/* Filter Controls Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search title, description, or tracking ID..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories (5)</option>
                      {(Object.keys(CATEGORIES_META) as ComplaintCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORIES_META[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      {(Object.keys(STATUS_META) as ComplaintStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {STATUS_META[st].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <select
                      value={`${sortBy}_${sortDir}`}
                      onChange={(e) => {
                        const [by, dir] = e.target.value.split("_");
                        setSortBy(by as "created_at" | "priority_score" | "updated_at");
                        setSortDir(dir as "asc" | "desc");
                        setPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="created_at_desc">Newest First</option>
                      <option value="created_at_asc">Oldest First</option>
                      <option value="priority_score_desc">Highest Priority (0-100)</option>
                      <option value="priority_score_asc">Lowest Priority</option>
                      <option value="updated_at_desc">Recently Updated</option>
                    </select>
                  </div>
                </div>

                {/* Active filter tags */}
                {(statusFilter || categoryFilter || search) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs text-slate-500">
                    <span className="font-semibold">Active filters:</span>
                    {categoryFilter && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                        Category: {CATEGORIES_META[categoryFilter as ComplaintCategory]?.label}
                        <button
                          type="button"
                          onClick={() => setCategoryFilter("")}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        Status: {STATUS_META[statusFilter as ComplaintStatus]?.label}
                        <button
                          type="button"
                          onClick={() => setStatusFilter("")}
                          className="hover:text-slate-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {search && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        Search: &quot;{search}&quot;
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="hover:text-slate-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter("");
                        setStatusFilter("");
                        setSearch("");
                        setPage(1);
                      }}
                      className="text-blue-600 hover:underline font-semibold ml-auto"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="mt-3 text-sm text-slate-500 font-medium">Loading complaints from database...</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && complaints.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="mt-3 text-base font-bold text-slate-800">No complaints found</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {search || statusFilter || categoryFilter
                      ? "Try adjusting or clearing your filters."
                      : "No complaints have been filed in the system yet."}
                  </p>
                </div>
              )}

              {/* Complaints Table */}
              {!isLoading && complaints.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Tracking ID & Date</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4">Issue Summary & Location</th>
                          <th className="py-3.5 px-4">Priority (0-100)</th>
                          <th className="py-3.5 px-4">SLA Deadline</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {complaints.map((c) => {
                          const sla = Array.isArray(c.sla_records) ? c.sla_records[0] : c.sla_records;
                          return (
                            <tr
                              key={c.id}
                              className="hover:bg-blue-50/40 transition group"
                            >
                              {/* Tracking ID & Date */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <Link
                                  href={`/track?id=${c.tracking_id}`}
                                  className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-1"
                                >
                                  <span>{c.tracking_id}</span>
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                                </Link>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {new Date(c.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </td>

                              {/* Category */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <CategoryBadge category={c.category} size="sm" />
                              </td>

                              {/* Title & Location */}
                              <td className="py-3 px-4 max-w-xs">
                                <p className="font-semibold text-slate-900 truncate" title={c.title}>
                                  {c.title}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{c.location_text || "Unspecified location"}</span>
                                </p>
                              </td>

                              {/* Priority Score */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <PriorityBadge score={c.priority_score} size="sm" />
                              </td>

                              {/* SLA Deadline */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {sla?.is_overdue ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Overdue</span>
                                  </span>
                                ) : sla?.deadline_at ? (
                                  <span className="text-[11px] text-slate-700 font-mono">
                                    {new Date(sla.deadline_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Under Triage</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <StatusBadge status={c.status} size="sm" />
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusModal(c)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer"
                                  title="Update status and notes"
                                >
                                  <FileEdit className="w-3 h-3 text-blue-600" />
                                  <span>Update</span>
                                </button>

                                <Link
                                  href={`/track?id=${c.tracking_id}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50 transition"
                                  title="Open citizen tracking view"
                                >
                                  <Eye className="w-3 h-3 text-slate-500" />
                                  <span>View</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs text-slate-600">
                    <span>
                      Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
                      <span className="font-semibold text-slate-900">{totalPages}</span> ({totalCount} total)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Duplicate Review Queue ────────────────────────────── */}
          {activeTab === "duplicates" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 text-xs text-purple-900 flex items-start gap-3">
                <GitMerge className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-purple-950">Intelligent Duplicate Detection</h3>
                  <p className="mt-0.5 text-purple-800 leading-relaxed">
                    CivicFix compares incoming complaints using token Jaccard similarity, category matching, and landmark clues.
                    Confirming a duplicate links it to the master issue while preserving every citizen&apos;s individual tracking ID.
                  </p>
                </div>
              </div>

              {isLoadingDuplicates && (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  <p className="mt-3 text-sm text-slate-500 font-medium">Checking duplicate suggestions queue...</p>
                </div>
              )}

              {!isLoadingDuplicates && duplicates.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="mt-3 text-base font-bold text-slate-800">Duplicate Queue Clear</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    No pending duplicate suggestions. All incoming complaints are currently distinct or already reviewed.
                  </p>
                </div>
              )}

              {!isLoadingDuplicates && duplicates.length > 0 && (
                <div className="space-y-4">
                  {duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Potential Duplicate Grouping
                          </span>
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 font-mono text-xs font-bold text-purple-800">
                            {Math.round(dup.similarity_score * 100)}% Similarity
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          Generated {new Date(dup.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Reasons pills */}
                      {dup.similarity_reasons && dup.similarity_reasons.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">Match factors:</span>
                          {dup.similarity_reasons.map((r, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Compare Box: Source vs Target */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Source complaint */}
                        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-blue-900">Incoming Complaint</span>
                            <span className="font-mono text-blue-700 font-semibold">
                              {dup.source?.tracking_id || dup.source_complaint_id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {dup.source?.title || "Complaint Title"}
                          </p>
                          {dup.source?.category && (
                            <CategoryBadge category={dup.source.category} size="sm" />
                          )}
                        </div>

                        {/* Target complaint */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">Existing Master Candidate</span>
                            <span className="font-mono text-slate-600 font-semibold">
                              {dup.target?.tracking_id || dup.target_complaint_id?.slice(0, 8) || "N/A"}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {dup.target?.title || "Matching Complaint"}
                          </p>
                          {dup.target?.category && (
                            <CategoryBadge category={dup.target.category} size="sm" />
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          disabled={duplicateActionLoading === dup.id}
                          onClick={() => handleDuplicateReview(dup.id, "reject")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                        >
                          Reject Match (Keep Separate)
                        </button>

                        <button
                          type="button"
                          disabled={duplicateActionLoading === dup.id}
                          onClick={() => handleDuplicateReview(dup.id, "confirm")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition cursor-pointer disabled:opacity-50"
                        >
                          {duplicateActionLoading === dup.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Duplicate (Link Issue)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Status Update Modal ─────────────────────────────────────────── */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700">
                  {selectedComplaint.tracking_id}
                </span>
                <h3 className="text-lg font-bold text-slate-900">Update Complaint Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details Preview */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">{selectedComplaint.title}</p>
              <p className="text-slate-500 truncate">{selectedComplaint.location_text}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-400">Current:</span>
                <StatusBadge status={selectedComplaint.status} size="sm" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 uppercase tracking-wider">
                  New Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pending", "in_progress", "resolved", "overdue", "duplicate"] as ComplaintStatus[]).map(
                    (st) => {
                      const isSelected = newStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100 shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              STATUS_META[st]?.dotClass || "bg-slate-400"
                            }`}
                          />
                          <span>{STATUS_META[st]?.label || st}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="status-notes"
                  className="block text-xs font-semibold text-slate-800 mb-1.5 uppercase tracking-wider"
                >
                  Admin / Crew Notes <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  id="status-notes"
                  rows={3}
                  placeholder="e.g. Field inspection completed. Asphalt resurfacing scheduled for tomorrow morning."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {statusUpdateError && (
                <p className="text-xs text-rose-600 font-semibold">{statusUpdateError}</p>
              )}

              {statusUpdateSuccess && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Status updated successfully! Refreshing...</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus || statusUpdateSuccess}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

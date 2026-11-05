/**
 * Shared TypeScript types for the CivicFix platform.
 * These mirror the Supabase database schema exactly.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ComplaintCategory =
  | "pothole"
  | "waste_accumulation"
  | "damaged_streetlight"
  | "blocked_drain"
  | "water_leakage";

export type ComplaintStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "overdue"
  | "duplicate";

export type UserRole = "citizen" | "admin";

export type DuplicateSuggestionStatus = "pending" | "confirmed" | "rejected";

// ─── Database row types ───────────────────────────────────────────────────────

export interface Profile {
  id: string; // references auth.users(id)
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  tracking_id: string; // e.g. CF-2024-001234
  citizen_id: string | null; // null for anonymous submissions
  category: ComplaintCategory;
  status: ComplaintStatus;
  title: string;
  description: string;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  landmark_clues: string | null;
  image_urls: string[];
  priority_score: number | null;
  priority_breakdown: PriorityBreakdown | null;
  ai_classification_raw: Record<string, unknown> | null;
  missing_info_flags: string[];
  requires_clarification: boolean;
  assigned_to: string | null; // references profiles(id)
  master_issue_id: string | null; // references master_issues(id)
  created_at: string;
  updated_at: string;
}

export interface PriorityBreakdown {
  safety_severity: number; // 0–30
  people_affected: number; // 0–25
  recurrence: number; // 0–20
  sla_pressure: number; // 0–15
  evidence_confidence: number; // 0–10
  total: number; // 0–100
}

export interface MasterIssue {
  id: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  complaint_count: number;
  priority_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface DuplicateSuggestion {
  id: string;
  source_complaint_id: string;
  target_complaint_id: string | null;
  master_issue_id: string | null;
  similarity_score: number; // 0.0–1.0
  similarity_reasons: string[];
  status: DuplicateSuggestionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  complaint_id: string;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface SlaRecord {
  id: string;
  complaint_id: string;
  category: ComplaintCategory;
  priority_score: number;
  deadline_hours: number;
  deadline_at: string;
  resolved_at: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

// ─── API request / response shapes ───────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface ComplaintSubmissionResult {
  complaint_id: string;
  tracking_id: string;
  status: ComplaintStatus;
  category: ComplaintCategory;
  priority_score: number | null;
  requires_clarification: boolean;
  missing_info_flags: string[];
  duplicate_suggestions: DuplicateSuggestion[];
}

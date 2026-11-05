/**
 * Typed helpers for Supabase operations.
 *
 * These wrappers bypass the strict generic inference of @supabase/supabase-js
 * when using a stub Database type (pre-generated types).
 * Once you run `npx supabase gen types typescript` these become redundant but
 * remain harmless.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Complaint,
  MasterIssue,
  DuplicateSuggestion,
  StatusHistory,
  SlaRecord,
} from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = ReturnType<typeof getSupabaseAdminClient> & { from: any };

export function adminDb() {
  return getSupabaseAdminClient() as AnyClient;
}

// ─── Typed insert helpers ─────────────────────────────────────────────────────

export async function insertComplaint(
  data: Omit<Complaint, "id" | "created_at" | "updated_at">
): Promise<{ data: Complaint | null; error: { message: string } | null }> {
  const result = await adminDb()
    .from("complaints")
    .insert(data)
    .select()
    .single();
  return result as { data: Complaint | null; error: { message: string } | null };
}

export async function insertSlaRecord(
  data: Omit<SlaRecord, "id" | "created_at" | "updated_at">
): Promise<void> {
  await adminDb().from("sla_records").insert(data);
}

export async function insertStatusHistory(
  data: Omit<StatusHistory, "id" | "created_at">
): Promise<void> {
  await adminDb().from("status_history").insert(data);
}

export async function insertDuplicateSuggestion(
  data: Omit<DuplicateSuggestion, "id" | "created_at">
): Promise<void> {
  await adminDb().from("duplicate_suggestions").insert(data);
}

export async function fetchComplaintById(
  id: string
): Promise<{ data: Complaint | null; error: { message: string } | null }> {
  const result = await adminDb()
    .from("complaints")
    .select("*")
    .eq("id", id)
    .single();
  return result as { data: Complaint | null; error: { message: string } | null };
}

export async function fetchComplaintByTrackingId(
  trackingId: string
): Promise<{ data: Complaint | null; error: { message: string } | null }> {
  const result = await adminDb()
    .from("complaints")
    .select("*, status_history(*), sla_records(*), duplicate_suggestions!source_complaint_id(*)")
    .eq("tracking_id", trackingId)
    .single();
  return result as { data: Complaint | null; error: { message: string } | null };
}

export async function fetchComplaintWithRelations(
  id: string
): Promise<{ data: (Complaint & { status_history: StatusHistory[]; sla_records: SlaRecord[]; duplicate_suggestions: DuplicateSuggestion[] }) | null; error: { message: string } | null }> {
  const result = await adminDb()
    .from("complaints")
    .select("*, status_history(*), sla_records(*), duplicate_suggestions!source_complaint_id(*)")
    .eq("id", id)
    .single();
  return result as never;
}

export async function updateComplaintStatus(
  id: string,
  status: Complaint["status"]
): Promise<{ data: Complaint | null; error: { message: string } | null }> {
  const result = await adminDb()
    .from("complaints")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return result as { data: Complaint | null; error: { message: string } | null };
}

export async function fetchRecentComplaintsByCategory(
  category: string,
  excludeId: string,
  limit = 50
): Promise<Complaint[]> {
  const result = await adminDb()
    .from("complaints")
    .select("*")
    .eq("category", category)
    .neq("id", excludeId)
    .neq("status", "duplicate")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (result.data ?? []) as Complaint[];
}

export async function fetchComplaintsAdmin(options: {
  status?: string;
  category?: string;
  assigned_to?: string;
  search?: string;
  sort_by: string;
  sort_dir: "asc" | "desc";
  offset: number;
  limit: number;
}): Promise<{ data: Complaint[]; count: number | null; error: { message: string } | null }> {
  let query = adminDb()
    .from("complaints")
    .select("*, sla_records(*)", { count: "exact" });

  if (options.status) query = query.eq("status", options.status);
  if (options.category) query = query.eq("category", options.category);
  if (options.assigned_to) query = query.eq("assigned_to", options.assigned_to);
  if (options.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%,tracking_id.ilike.%${options.search}%`
    );
  }

  query = query
    .order(options.sort_by, { ascending: options.sort_dir === "asc" })
    .range(options.offset, options.offset + options.limit - 1);

  const result = await query;
  return {
    data: (result.data ?? []) as Complaint[],
    count: result.count,
    error: result.error as { message: string } | null,
  };
}

export async function fetchPendingDuplicateSuggestions(): Promise<DuplicateSuggestion[]> {
  const result = await adminDb()
    .from("duplicate_suggestions")
    .select(`
      *,
      source:complaints!source_complaint_id ( id, tracking_id, title, category, status ),
      target:complaints!target_complaint_id ( id, tracking_id, title, category, status )
    `)
    .eq("status", "pending")
    .order("similarity_score", { ascending: false });
  return (result.data ?? []) as DuplicateSuggestion[];
}

export async function fetchDuplicateSuggestionById(
  id: string
): Promise<{ data: DuplicateSuggestion | null; error: { message: string } | null }> {
  const result = await adminDb()
    .from("duplicate_suggestions")
    .select("*")
    .eq("id", id)
    .single();
  return result as { data: DuplicateSuggestion | null; error: { message: string } | null };
}

export async function updateDuplicateSuggestion(
  id: string,
  updates: { status: string; reviewed_at: string }
): Promise<void> {
  await adminDb().from("duplicate_suggestions").update(updates).eq("id", id);
}

export async function markComplaintAsDuplicate(
  complaintId: string,
  masterIssueId: string
): Promise<void> {
  await adminDb()
    .from("complaints")
    .update({ status: "duplicate", master_issue_id: masterIssueId, updated_at: new Date().toISOString() })
    .eq("id", complaintId);
}

export async function incrementMasterIssueCount(issueId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminDb() as any).rpc("increment_complaint_count", { issue_id: issueId });
}

export async function countComplaintsByCategory(
  category: string,
  sinceDate: Date
): Promise<number> {
  const result = await adminDb()
    .from("complaints")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .gte("created_at", sinceDate.toISOString());
  return result.count ?? 0;
}

export async function resolveSlaRecord(complaintId: string): Promise<void> {
  await adminDb()
    .from("sla_records")
    .update({ resolved_at: new Date().toISOString(), is_overdue: false, updated_at: new Date().toISOString() })
    .eq("complaint_id", complaintId);
}

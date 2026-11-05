/**
 * GET  /api/admin/duplicates   → list pending duplicate suggestions
 * PATCH /api/admin/duplicates  → confirm or reject by suggestion id (body: { id, action, master_issue_id? })
 *
 * Note: PATCH is on this route (not /[id]) because there are no dynamic
 * segments here — the suggestion id comes in the request body.
 */
import { NextRequest, NextResponse } from "next/server";
import { ReviewDuplicateSchema } from "@/lib/validation";
import {
  fetchPendingDuplicateSuggestions,
  fetchDuplicateSuggestionById,
  updateDuplicateSuggestion,
  markComplaintAsDuplicate,
  incrementMasterIssueCount,
  insertStatusHistory,
} from "@/lib/supabase/db";
import type { ApiResponse } from "@/types";

export async function GET(_req: NextRequest) {
  const data = await fetchPendingDuplicateSuggestions();
  return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Expect { id: string, action: 'confirm'|'reject', master_issue_id?: string }
  const bodyWithId = body as { id?: string } & Record<string, unknown>;
  const { id, ...rest } = bodyWithId;

  if (!id || typeof id !== "string") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "suggestion id is required in the request body" },
      { status: 422 }
    );
  }

  const parsed = ReviewDuplicateSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { action, master_issue_id } = parsed.data;

  if (action === "confirm" && !master_issue_id) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "master_issue_id is required when confirming a duplicate",
      },
      { status: 422 }
    );
  }

  const { data: suggestion, error: fetchErr } = await fetchDuplicateSuggestionById(id);
  if (fetchErr || !suggestion) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Duplicate suggestion not found" },
      { status: 404 }
    );
  }

  await updateDuplicateSuggestion(id, {
    status: action === "confirm" ? "confirmed" : "rejected",
    reviewed_at: new Date().toISOString(),
  });

  if (action === "confirm" && master_issue_id) {
    await markComplaintAsDuplicate(suggestion.source_complaint_id, master_issue_id);
    await insertStatusHistory({
      complaint_id: suggestion.source_complaint_id,
      from_status: "pending",
      to_status: "duplicate",
      changed_by: null,
      notes: `Confirmed duplicate of master issue ${master_issue_id}`,
    });
    await incrementMasterIssueCount(master_issue_id);
  }

  return NextResponse.json<ApiResponse<{ action: string; suggestion_id: string }>>({
    success: true,
    data: { action, suggestion_id: id },
  });
}

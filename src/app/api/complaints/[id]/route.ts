/**
 * GET /api/complaints/[id]
 *   Retrieve a complaint by its UUID or tracking ID.
 *
 * PATCH /api/complaints/[id]
 *   Update complaint status (admin only via service role).
 */
import { NextRequest, NextResponse } from "next/server";
import { UpdateStatusSchema } from "@/lib/validation";
import {
  fetchComplaintWithRelations,
  fetchComplaintByTrackingId,
  fetchComplaintById,
  updateComplaintStatus,
  insertStatusHistory,
  resolveSlaRecord,
} from "@/lib/supabase/db";
import type { ApiResponse } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const isTrackingId = id.startsWith("CF-");

  const { data, error } = isTrackingId
    ? await fetchComplaintByTrackingId(id)
    : await fetchComplaintWithRelations(id);

  if (error || !data) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Complaint not found" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
}

// ── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = UpdateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { status: newStatus, notes } = parsed.data;

  // Fetch current complaint to record from_status
  const { data: existing, error: fetchError } = await fetchComplaintById(id);
  if (fetchError || !existing) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Complaint not found" },
      { status: 404 }
    );
  }

  // Update complaint status
  const { data: updated, error: updateError } = await updateComplaintStatus(id, newStatus);
  if (updateError || !updated) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Failed to update complaint",
        details: updateError?.message,
      },
      { status: 500 }
    );
  }

  // Record status history
  await insertStatusHistory({
    complaint_id: id,
    from_status: existing.status,
    to_status: newStatus,
    changed_by: null,
    notes: notes ?? null,
  });

  // If resolved, update SLA record
  if (newStatus === "resolved") {
    await resolveSlaRecord(id);
  }

  return NextResponse.json<ApiResponse<typeof updated>>({
    success: true,
    data: updated,
  });
}

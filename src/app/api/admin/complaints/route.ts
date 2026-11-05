/**
 * GET /api/admin/complaints
 *
 * Admin-only endpoint. Returns a paginated, filterable list of complaints.
 */
import { NextRequest, NextResponse } from "next/server";
import { ListComplaintsQuerySchema } from "@/lib/validation";
import { fetchComplaintsAdmin } from "@/lib/supabase/db";
import type { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const parsed = ListComplaintsQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { page, limit, status, category, assigned_to, search, sort_by, sort_dir } =
    parsed.data;
  const offset = (page - 1) * limit;

  const { data, error, count } = await fetchComplaintsAdmin({
    status,
    category,
    assigned_to,
    search,
    sort_by,
    sort_dir,
    offset,
    limit,
  });

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Database query failed", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}

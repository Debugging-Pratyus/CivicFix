/**
 * POST /api/complaints/upload
 *
 * Generates a Supabase Storage signed upload URL for complaint images.
 * The client then uploads directly to Supabase — the image never passes
 * through our Next.js server, keeping memory usage low.
 *
 * The bucket must be created in Supabase before this endpoint works.
 * Bucket name: complaint-images
 * Access: private (authenticated uploads, public reads via signed URLs)
 */
import { NextRequest, NextResponse } from "next/server";
import { ImageUploadQuerySchema } from "@/lib/validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types";

const BUCKET = "complaint-images";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const SIGNED_URL_EXPIRES_IN_SECONDS = 300; // 5 minutes

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = ImageUploadQuerySchema.safeParse(body);
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

  const { complaint_id, file_name, content_type } = parsed.data;

  // Build a unique storage path to prevent collisions
  const timestamp = Date.now();
  const sanitisedName = file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = complaint_id
    ? `${complaint_id}/${timestamp}_${sanitisedName}`
    : `anonymous/${timestamp}_${sanitisedName}`;

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("[POST /api/complaints/upload] Storage error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Failed to generate upload URL",
        details: error?.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json<
    ApiResponse<{
      upload_url: string;
      storage_path: string;
      token: string;
      expires_in: number;
      max_file_size_bytes: number;
      allowed_content_types: string[];
    }>
  >({
    success: true,
    data: {
      upload_url: data.signedUrl,
      storage_path: storagePath,
      token: data.token,
      expires_in: SIGNED_URL_EXPIRES_IN_SECONDS,
      max_file_size_bytes: MAX_FILE_SIZE_BYTES,
      allowed_content_types: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ],
    },
  });
}

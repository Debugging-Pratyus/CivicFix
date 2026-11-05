/**
 * GET /api/health
 *
 * Returns the operational status of CivicFix and its dependencies.
 * Does NOT expose secrets — only reports reachability.
 */
import { NextResponse } from "next/server";
import { clientEnv } from "@/lib/env";

export async function GET() {
  const checks: Record<string, string> = {
    api: "ok",
    supabase_url_configured: clientEnv.NEXT_PUBLIC_SUPABASE_URL
      ? "ok"
      : "missing",
    gemini_key_configured:
      typeof process.env.GEMINI_API_KEY === "string" &&
      process.env.GEMINI_API_KEY.length > 0
        ? "ok"
        : "missing",
    service_role_key_configured:
      typeof process.env.SUPABASE_SERVICE_ROLE_KEY === "string" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.length > 0
        ? "ok"
        : "missing",
  };

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}

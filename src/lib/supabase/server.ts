/**
 * Supabase server client for Next.js App Router.
 * Uses cookies for session management via @supabase/ssr.
 * Safe to use in server components and route handlers.
 *
 * IMPORTANT: Call this inside the request handler — do not cache at module level.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { clientEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll may throw in server components (read-only context);
            // middleware handles cookie refresh in those cases.
          }
        },
      },
    }
  );
}

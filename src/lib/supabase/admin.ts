/**
 * Supabase admin client using the service role key.
 * Bypasses Row Level Security — only use in trusted server-side code.
 * Never import this in client components.
 */
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  if (_adminClient) return _adminClient;
  _adminClient = createClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  return _adminClient;
}

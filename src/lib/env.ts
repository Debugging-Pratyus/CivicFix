/**
 * Environment variable validation using Zod.
 *
 * Server-side secrets are intentionally not exported from this file for client use.
 * Import `clientEnv` in browser code, `serverEnv` only in server components / route handlers.
 *
 * Validation runs at RUNTIME only (not during `next build`) so the build can
 * succeed without a .env.local file. At runtime, missing variables will throw
 * immediately when any server route is first called.
 */
import { z } from "zod";

// ─── Client-safe variables (all prefixed NEXT_PUBLIC_) ───────────────────────
const clientSchema = z.object({

  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
});

// ─── Server-only variables ───────────────────────────────────────────────────
const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
});

// ─── Parse and export ────────────────────────────────────────────────────────
function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, unknown> = process.env
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }
  return result.data;
}

// Lazy-evaluated so they only throw when first accessed at runtime
let _clientEnv: z.infer<typeof clientSchema> | null = null;
let _serverEnv: z.infer<typeof serverSchema> | null = null;

/**
 * Client-safe environment variables.
 * Safe to import in browser code.
 */
export function getClientEnv(): z.infer<typeof clientSchema> {
  if (!_clientEnv) {
    _clientEnv = parseEnv(clientSchema, {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
  }

  return _clientEnv;
}

/**
 * Full server-side environment (includes secrets).
 * Only import this in server components, route handlers, or server actions.
 */
export function getServerEnv(): z.infer<typeof serverSchema> {
  if (!_serverEnv) _serverEnv = parseEnv(serverSchema);
  return _serverEnv;
}

// Convenience re-exports for modules that import the value directly.
// These are getters so validation happens on first access, not at module load.
// This prevents build-time failures when .env.local doesn't exist.
export const clientEnv = new Proxy({} as z.infer<typeof clientSchema>, {
  get(_target, prop) {
    return getClientEnv()[prop as keyof z.infer<typeof clientSchema>];
  },
});

export const serverEnv = new Proxy({} as z.infer<typeof serverSchema>, {
  get(_target, prop) {
    return getServerEnv()[prop as keyof z.infer<typeof serverSchema>];
  },
});

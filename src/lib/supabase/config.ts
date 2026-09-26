/**
 * Resolves how the Supabase client should behave at runtime.
 *
 * The mock backend exists ONLY for local development and must never engage
 * silently: a deployed build with missing env vars used to fall back to a
 * localStorage mock that accepted fake accounts and stored typed passwords
 * in cleartext on the device. The mock now requires an explicit dev opt-in
 * and is hard-disabled in production builds.
 */
export type SupabaseMode = "live" | "mock" | "unconfigured";

export interface SupabaseEnv {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_ENABLE_MOCK_AUTH?: string;
  NODE_ENV?: string;
}

/** True when real Supabase project keys are present and not placeholders. */
export function isSupabaseConfigured(env: SupabaseEnv): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url !== "https://example.supabase.co" &&
    !url.includes("your-project")
  );
}

/**
 * True only for an explicit, non-production opt-in. Production builds can
 * never enable the mock, regardless of env configuration.
 */
export function isMockAuthAllowed(env: SupabaseEnv): boolean {
  return env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true" && env.NODE_ENV !== "production";
}

export function resolveSupabaseMode(env: SupabaseEnv): SupabaseMode {
  if (isSupabaseConfigured(env)) return "live";
  if (isMockAuthAllowed(env)) return "mock";
  return "unconfigured";
}

export const SUPABASE_UNCONFIGURED_ERROR = {
  message:
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or for local development set NEXT_PUBLIC_ENABLE_MOCK_AUTH=true (never works in production builds).",
  code: "SUPABASE_NOT_CONFIGURED",
} as const;

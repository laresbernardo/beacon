import test from "node:test";
import assert from "node:assert/strict";
import { resolveSupabaseMode, isMockAuthAllowed } from "./config";

const LIVE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "real-anon-key",
};

test("live mode when real keys are present", () => {
  assert.equal(resolveSupabaseMode({ ...LIVE_ENV, NODE_ENV: "production" }), "live");
  assert.equal(resolveSupabaseMode({ ...LIVE_ENV, NODE_ENV: "development" }), "live");
});

test("placeholder or missing keys are not 'configured'", () => {
  assert.equal(resolveSupabaseMode({ NODE_ENV: "development" }), "unconfigured");
  assert.equal(
    resolveSupabaseMode({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "key",
      NODE_ENV: "development",
    }),
    "unconfigured"
  );
  assert.equal(
    resolveSupabaseMode({
      NEXT_PUBLIC_SUPABASE_URL: "https://your-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "key",
      NODE_ENV: "development",
    }),
    "unconfigured"
  );
  assert.equal(
    resolveSupabaseMode({ NEXT_PUBLIC_SUPABASE_URL: LIVE_ENV.NEXT_PUBLIC_SUPABASE_URL, NODE_ENV: "development" }),
    "unconfigured"
  );
});

test("mock requires the explicit dev opt-in", () => {
  assert.equal(
    resolveSupabaseMode({ NODE_ENV: "development", NEXT_PUBLIC_ENABLE_MOCK_AUTH: "true" }),
    "mock"
  );
  assert.equal(resolveSupabaseMode({ NODE_ENV: "development" }), "unconfigured");
  assert.equal(
    resolveSupabaseMode({ NODE_ENV: "development", NEXT_PUBLIC_ENABLE_MOCK_AUTH: "1" }),
    "unconfigured"
  );
});

test("mock can NEVER engage in production, even with the flag set", () => {
  assert.equal(
    resolveSupabaseMode({ NODE_ENV: "production", NEXT_PUBLIC_ENABLE_MOCK_AUTH: "true" }),
    "unconfigured"
  );
  assert.equal(
    isMockAuthAllowed({ NODE_ENV: "production", NEXT_PUBLIC_ENABLE_MOCK_AUTH: "true" }),
    false
  );
});

test("real keys win over the mock flag", () => {
  assert.equal(
    resolveSupabaseMode({ ...LIVE_ENV, NODE_ENV: "development", NEXT_PUBLIC_ENABLE_MOCK_AUTH: "true" }),
    "live"
  );
});

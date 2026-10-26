import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const source = readFileSync(new URL("../src/lib/product-engagement.ts", import.meta.url), "utf8")
  .replace(/^import .*;\r?\n/gm, "")
  .replace("export function", "function");

function harness() {
  const calls: Array<{ p_slug: string; p_event: string; p_session: string }> = [];
  let consent = false;
  let fail = false;
  const storage = new Map<string, string>();
  const browser = {
    location: { pathname: "/products" },
    sessionStorage: {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  };
  const record = new Function(
    "supabase",
    "readTrackingConsent",
    "window",
    `${stripTypeScriptTypes(source)}; return recordProductEngagement;`,
  )(
    {
      rpc: (_name: string, args: (typeof calls)[number]) => {
        calls.push(args);
        return Promise.resolve({ error: fail ? new Error("offline") : null });
      },
    },
    () => ({ analytics: consent }),
    browser,
  ) as (slug: string, event: string) => void;
  return {
    calls,
    browser,
    record,
    consent: () => {
      consent = true;
    },
    fail: (value: boolean) => {
      fail = value;
    },
  };
}

test("engagement requires analytics consent and excludes admin pages", () => {
  const h = harness();
  h.record("phone", "click");
  assert.equal(h.calls.length, 0);
  h.consent();
  h.browser.location.pathname = "/admin/products";
  h.record("phone", "view");
  assert.equal(h.calls.length, 0);
});

test("repeat events deduplicate while different signals share an anonymous session", () => {
  const h = harness();
  h.consent();
  for (const event of ["click", "view", "cart", "click", "cart"]) h.record("phone", event);
  assert.deepEqual(
    h.calls.map((call) => call.p_event),
    ["click", "view", "cart"],
  );
  assert.equal(new Set(h.calls.map((call) => call.p_session)).size, 1);
  assert.match(h.calls[0].p_session, /^[0-9a-f-]{36}$/);
});

test("failed writes can retry and restricted storage does not interrupt shopping", async () => {
  const h = harness();
  h.consent();
  h.fail(true);
  h.record("phone", "click");
  await new Promise((resolve) => setImmediate(resolve));
  h.fail(false);
  h.record("phone", "click");
  assert.equal(h.calls.length, 2);
  h.browser.sessionStorage.getItem = () => {
    throw new Error("storage unavailable");
  };
  assert.doesNotThrow(() => h.record("other-phone", "click"));
  assert.equal(h.calls.length, 2);
});

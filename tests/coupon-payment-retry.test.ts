import { test } from "node:test";
import assert from "node:assert/strict";
import { resumeCouponCashfreeOrder } from "../src/lib/cashfree.server.ts";

test("coupon payment retries reuse the existing provider session and validate its status/amount", async (t) => {
  const old = {
    app: process.env.CASHFREE_APP_ID,
    key: process.env.CASHFREE_SECRET_KEY,
    environment: process.env.CASHFREE_ENVIRONMENT,
  };
  process.env.CASHFREE_APP_ID = "unit-test";
  process.env.CASHFREE_SECRET_KEY = "unit-test";
  process.env.CASHFREE_ENVIRONMENT = "sandbox";
  t.after(() => {
    for (const [name, value] of [
      ["CASHFREE_APP_ID", old.app],
      ["CASHFREE_SECRET_KEY", old.key],
      ["CASHFREE_ENVIRONMENT", old.environment],
    ]) {
      if (value === undefined) delete process.env[name!];
      else process.env[name!] = value;
    }
  });
  let status = 200;
  let payload: Record<string, unknown> = {
    order_id: "agh_test",
    order_amount: 2499,
    order_currency: "INR",
    order_status: "ACTIVE",
    payment_session_id: "original-session",
  };
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    assert.ok(
      !init.method || init.method === "GET",
      "Retry lookup must not create a new provider order",
    );
    return new Response(JSON.stringify(payload), { status });
  });
  assert.deepEqual(await resumeCouponCashfreeOrder("test", 249900), {
    cashfreeOrderId: "agh_test",
    paymentSessionId: "original-session",
    environment: "sandbox",
  });
  payload.order_status = "PAID";
  await assert.rejects(() => resumeCouponCashfreeOrder("test", 249900), /already paid/);
  payload.order_status = "EXPIRED";
  await assert.rejects(() => resumeCouponCashfreeOrder("test", 249900), /expired/);
  payload.order_status = "ACTIVE";
  payload.order_amount = 1;
  await assert.rejects(() => resumeCouponCashfreeOrder("test", 249900), /amount/);
  status = 404;
  payload = { message: "not found" };
  assert.equal(await resumeCouponCashfreeOrder("test", 249900), null);
  status = 503;
  await assert.rejects(() => resumeCouponCashfreeOrder("test", 249900), /503/);
});

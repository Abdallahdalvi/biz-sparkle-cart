import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildMetaUserData } from "../src/lib/meta-conversions.server.ts";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

test("Meta user data hashes contact fields and preserves match identifiers", () => {
  const userData = buildMetaUserData({
    email: " Buyer@Example.com ",
    phone: "+91 93721 68726",
    externalId: "customer-123",
    attribution: {
      fbp: "fb.1.1234567890.123456789",
      fbc: "fb.1.1234567890.AbCdEf",
      clientIpAddress: "203.0.113.42",
      clientUserAgent: "Mozilla/5.0 Test Browser",
    },
  });

  assert.deepEqual(userData.em, [sha256("buyer@example.com")]);
  assert.deepEqual(userData.ph, [sha256("919372168726")]);
  assert.deepEqual(userData.external_id, [sha256("customer-123")]);
  assert.equal(userData.fbp, "fb.1.1234567890.123456789");
  assert.equal(userData.fbc, "fb.1.1234567890.AbCdEf");
  assert.equal(userData.client_ip_address, "203.0.113.42");
  assert.equal(userData.client_user_agent, "Mozilla/5.0 Test Browser");
});

test("invalid or absent optional data is omitted", () => {
  const userData = buildMetaUserData({
    email: "buyer@example.com",
    phone: "not-a-phone",
    externalId: "order-1",
    attribution: { fbp: "   ", fbc: undefined },
  });

  assert.equal("ph" in userData, false);
  assert.equal("fbp" in userData, false);
  assert.equal("fbc" in userData, false);
});

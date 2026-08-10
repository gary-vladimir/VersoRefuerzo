// Route-level tests for PATCH /api/me.
//
// The timezone this route accepts is fed to dayjs.tz() by the streak, queue,
// and stats paths on every later request, so an unresolvable value would
// turn reads into 500s long after the bad write. These cover that the guard
// holds at the route boundary, not just in the schema.

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { FakeDb } from "./helpers/fakeDb";

let currentUser: Record<string, unknown> | null = null;
let db: FakeDb;

vi.mock("@/lib/auth/session", () => ({
  getServerUser: () => Promise.resolve(currentUser),
  clearSessionCookie: () => Promise.resolve(),
}));

vi.mock("@/db/client", () => ({
  getDb: () => db,
}));

const { PATCH } = await import("@/app/api/me/route");

function patch(body: unknown): Promise<Response> {
  return PATCH({ json: async () => body } as unknown as NextRequest);
}

function updatedFields(): Record<string, unknown> {
  return (db.argsFor("set")?.[0] ?? {}) as Record<string, unknown>;
}

beforeEach(() => {
  currentUser = { id: "u1" };
  db = new FakeDb([[{ id: "u1" }]]);
});

describe("PATCH /api/me", () => {
  it("401s without a session", async () => {
    currentUser = null;
    expect((await patch({ locale: "en" })).status).toBe(401);
  });

  it("accepts a real IANA timezone", async () => {
    const res = await patch({ timezone: "Europe/Madrid" });
    expect(res.status).toBe(200);
    expect(updatedFields().timezone).toBe("Europe/Madrid");
  });

  it("rejects a timezone Intl cannot resolve", async () => {
    for (const timezone of ["Mars/Olympus_Mons", "", "GMT+5", "  "]) {
      db = new FakeDb([[{ id: "u1" }]]);
      const res = await patch({ timezone });
      expect(res.status).toBe(400);
      expect(db.calls.some((c) => c.method === "update")).toBe(false);
    }
  });

  it("still accepts the other preference fields", async () => {
    const res = await patch({ locale: "en", soundEnabled: false });
    expect(res.status).toBe(200);
    expect(updatedFields().locale).toBe("en");
    expect(updatedFields().soundEnabled).toBe(false);
  });

  it("rejects an unknown locale", async () => {
    expect((await patch({ locale: "fr" })).status).toBe(400);
  });
});

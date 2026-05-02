import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getServerUser, clearSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";

export const runtime = "nodejs";

const PatchBody = z.object({
  locale: z.enum(["es", "en"]).optional(),
  soundEnabled: z.boolean().optional(),
  hasCompletedOnboarding: z.boolean().optional(),
  hasSeenAloudTip: z.boolean().optional(),
  lastVersion: z.string().optional(),
  timezone: z.string().optional(),
});

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const db = getDb();
  const updated = await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();

  return NextResponse.json({ user: updated[0] });
}

export async function DELETE() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();
  await db.delete(users).where(eq(users.id, user.id));
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

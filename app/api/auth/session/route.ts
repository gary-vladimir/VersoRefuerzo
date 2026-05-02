import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  createSessionCookie,
  setSessionCookie,
  clearSessionCookie,
  upsertUserFromIdToken,
} from "@/lib/auth/session";

export const runtime = "nodejs";

const Body = z.object({
  idToken: z.string().min(1),
  timezone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const user = await upsertUserFromIdToken(
      parsed.data.idToken,
      parsed.data.timezone ?? null,
    );
    const sessionCookie = await createSessionCookie(parsed.data.idToken);
    await setSessionCookie(sessionCookie);
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        locale: user.locale,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (err) {
    console.error("session POST failed", err);
    return NextResponse.json({ error: "auth_failed" }, { status: 401 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

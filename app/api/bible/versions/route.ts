// GET /api/bible/versions  →  list of versions the deployed key actually
// licenses, intersected with the v1 allowlist (specs.md §9.2). Returns an
// empty list if no env IDs are configured (the UI falls back accordingly).

import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/session";
import { availableVersions } from "@/lib/bible/apibible";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({
    versions: availableVersions().map((v) => v.key),
  });
}

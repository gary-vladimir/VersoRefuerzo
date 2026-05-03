// GET /api/bible/text?ref=JHN.14.6&version=NBLA
//
// Returns the verse text for a canonical reference + version. Goes through the
// shared cache; on miss, fetches API.Bible exactly once (specs.md §9.3, AC-8).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerUser } from "@/lib/auth/session";
import { getVerseText, VERSION_KEYS } from "@/lib/bible/apibible";
import { isValidUsfmRef } from "@/lib/bible/reference";

export const runtime = "nodejs";

const QuerySchema = z.object({
  ref: z.string().refine(isValidUsfmRef),
  version: z.enum(VERSION_KEYS as [string, ...string[]]),
});

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const params = QuerySchema.safeParse({
    ref: req.nextUrl.searchParams.get("ref") ?? "",
    version: req.nextUrl.searchParams.get("version") ?? "",
  });
  if (!params.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  try {
    const result = await getVerseText(
      params.data.ref,
      params.data.version as "NBLA" | "NVI" | "RVR1960",
    );
    return NextResponse.json({
      canonicalRef: result.canonicalRef,
      version: result.version,
      text: result.text,
      copyrightAttribution: result.copyrightAttribution,
      source: result.source,
    });
  } catch (err) {
    console.error("/api/bible/text failed", err);
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}

import type { NextRequest } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import {
  getReadingProgress,
  palLinkExists,
  upsertReadingProgress,
  type ReadingProgressPatch
} from "@/lib/server/pals/palsDb";

export const dynamic = "force-dynamic";

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const x = typeof n === "number" ? n : typeof n === "string" ? Number(n) : NaN;
  if (!Number.isFinite(x)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(x)));
}

function currentIsoDateForTimeZone(timeZone?: string | null): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone?.trim() || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    /* fall back to UTC below */
  }
  return new Date().toISOString().slice(0, 10);
}

function parsePatch(body: unknown): ReadingProgressPatch | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const patch: ReadingProgressPatch = {};
  if ("targetSurahId" in o) patch.targetSurahId = clampInt(o.targetSurahId, 1, 114, 1);
  if ("versesReadWeek" in o) patch.versesReadWeek = clampInt(o.versesReadWeek, 0, 9999, 0);
  if ("totalVersesRead" in o) patch.totalVersesRead = clampInt(o.totalVersesRead, 0, 99999, 0);
  if ("weeklyGoal" in o) patch.weeklyGoal = clampInt(o.weeklyGoal, 1, 500, 100);
  return Object.keys(patch).length ? patch : null;
}

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const partnerId = req.nextUrl.searchParams.get("partnerId")?.trim() ?? "";
    const todayIsoDate = currentIsoDateForTimeZone(req.headers.get("x-timezone"));
    const self = await getReadingProgress(auth.userId, todayIsoDate);
    let partner = null;
    if (partnerId && partnerId !== auth.userId) {
      const linked = await palLinkExists(auth.userId, partnerId);
      if (linked) partner = await getReadingProgress(partnerId, todayIsoDate);
    }
    return Response.json({ self, partner });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not load pal reading progress." },
      { status: 503 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const patch = parsePatch(body);
  if (!patch) return Response.json({ message: "No valid fields to update." }, { status: 400 });

  try {
    const todayIsoDate = currentIsoDateForTimeZone(req.headers.get("x-timezone"));
    const self = await upsertReadingProgress(auth.userId, patch, todayIsoDate);
    return Response.json({ self });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not save pal reading progress." },
      { status: 503 }
    );
  }
}

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

function parsePatch(body: unknown): ReadingProgressPatch | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const patch: ReadingProgressPatch = {};
  if ("targetSurahId" in o) patch.targetSurahId = clampInt(o.targetSurahId, 1, 114, 1);
  if ("versesReadWeek" in o) patch.versesReadWeek = clampInt(o.versesReadWeek, 0, 9999, 0);
  if ("totalVersesRead" in o) patch.totalVersesRead = clampInt(o.totalVersesRead, 0, 99999, 0);
  if ("weeklyGoal" in o) patch.weeklyGoal = clampInt(o.weeklyGoal, 1, 500, 100);
  if ("streakDays" in o) patch.streakDays = clampInt(o.streakDays, 0, 10000, 0);
  if ("streakActive" in o) patch.streakActive = Boolean(o.streakActive);
  return Object.keys(patch).length ? patch : null;
}

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const partnerId = req.nextUrl.searchParams.get("partnerId")?.trim() ?? "";
    const self = await getReadingProgress(auth.userId);
    let partner = null;
    if (partnerId && partnerId !== auth.userId) {
      const linked = await palLinkExists(auth.userId, partnerId);
      if (linked) partner = await getReadingProgress(partnerId);
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
    const self = await upsertReadingProgress(auth.userId, patch);
    return Response.json({ self });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not save pal reading progress." },
      { status: 503 }
    );
  }
}

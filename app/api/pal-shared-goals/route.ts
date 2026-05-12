import type { NextRequest } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import { listPalSharedGoals, palLinkExists, upsertPalSharedGoal } from "@/lib/server/pals/palsDb";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";

export const dynamic = "force-dynamic";

type CreatePalSharedGoalBody = {
  partnerId?: string;
  targetSurahId?: number;
  versesPerDay?: number;
  daysPerWeek?: number;
  targetDate?: string;
};

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const x = typeof n === "number" ? n : typeof n === "string" ? Number(n) : NaN;
  if (!Number.isFinite(x)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(x)));
}

function dbMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  if (/pal_shared_goals/i.test(raw)) {
    return "Shared goals database not ready. Run the latest pals migration for this deployment.";
  }
  return raw || fallback;
}

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const partnerId = req.nextUrl.searchParams.get("partnerId")?.trim() ?? "";
    const goals = await listPalSharedGoals(auth.userId);
    const filtered = partnerId ? goals.filter((goal) => goal.partnerId === partnerId) : goals;
    return Response.json({ goals: filtered });
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not load shared goals.") }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  let body: CreatePalSharedGoalBody;
  try {
    body = (await req.json()) as CreatePalSharedGoalBody;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const partnerId = body.partnerId?.trim() ?? "";
  if (!isLikelyPartnerUserId(partnerId) || partnerId === auth.userId) {
    return Response.json({ message: "Invalid partner id." }, { status: 400 });
  }

  const targetSurahId = clampInt(body.targetSurahId, 1, 114, 2);
  const versesPerDay = clampInt(body.versesPerDay, 1, 286, 1);
  const daysPerWeek = clampInt(body.daysPerWeek, 1, 7, 7);
  const targetDate = typeof body.targetDate === "string" ? body.targetDate.trim() : "";

  try {
    const linked = await palLinkExists(auth.userId, partnerId);
    if (!linked) {
      return Response.json({ message: "Link this pal first before creating a shared goal." }, { status: 403 });
    }

    const goal = await upsertPalSharedGoal({
      userId: auth.userId,
      partnerId,
      targetSurahId,
      versesPerDay,
      daysPerWeek,
      targetDate
    });

    return Response.json({ goal }, { status: 201 });
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not save shared goal.") }, { status: 503 });
  }
}

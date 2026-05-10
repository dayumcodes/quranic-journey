import type { NextRequest } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import { upsertPalLink } from "@/lib/server/pals/palsDb";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";

export const dynamic = "force-dynamic";

type AcceptPalBody = {
  partnerId?: string;
  partnerDisplayName?: string;
  myDisplayNameForPartner?: string;
};

export async function POST(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as AcceptPalBody;
  const partnerId = body.partnerId?.trim() ?? "";
  if (!isLikelyPartnerUserId(partnerId) || partnerId === auth.userId) {
    return Response.json({ message: "Invalid partner id." }, { status: 400 });
  }

  try {
    await upsertPalLink({
      meId: auth.userId,
      partnerId,
      partnerDisplayName: body.partnerDisplayName?.trim(),
      myDisplayNameForPartner: body.myDisplayNameForPartner?.trim()
    });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not save pal link." },
      { status: 500 }
    );
  }
}

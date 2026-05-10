import type { NextRequest } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import { deletePalLink } from "@/lib/server/pals/palsDb";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ partnerId: string }> }
) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });
  const { partnerId } = await context.params;
  const pid = partnerId?.trim() ?? "";
  if (!isLikelyPartnerUserId(pid)) {
    return Response.json({ message: "Invalid partner id." }, { status: 400 });
  }
  try {
    await deletePalLink(auth.userId, pid);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not remove pal link." },
      { status: 500 }
    );
  }
}

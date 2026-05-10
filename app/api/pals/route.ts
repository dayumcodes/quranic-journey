import type { NextRequest } from "next/server";
import { listPalLinks } from "@/lib/server/pals/palsDb";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const rows = await listPalLinks(auth.userId);
    return Response.json({ pals: rows });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not load pals." },
      { status: 500 }
    );
  }
}

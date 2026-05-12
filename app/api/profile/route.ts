import type { NextRequest } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import { getUserProfile, renameUserInPalLinks, upsertUserProfile } from "@/lib/server/pals/palsDb";

export const dynamic = "force-dynamic";

type UpdateProfileBody = {
  displayName?: string;
};

function cleanDisplayName(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
}

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const profile = await getUserProfile(auth.userId);
    return Response.json({ profile });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not load profile." },
      { status: 503 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  let body: UpdateProfileBody;
  try {
    body = (await req.json()) as UpdateProfileBody;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const displayName = cleanDisplayName(body.displayName);
  if (displayName.length < 2 || displayName.length > 60) {
    return Response.json({ message: "Name must be between 2 and 60 characters." }, { status: 422 });
  }

  try {
    const profile = await upsertUserProfile(auth.userId, displayName);
    await renameUserInPalLinks(auth.userId, displayName);
    return Response.json({ profile });
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Could not update profile." },
      { status: 503 }
    );
  }
}

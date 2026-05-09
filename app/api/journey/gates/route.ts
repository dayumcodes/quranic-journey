import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GATES_TOTAL = 30;

const COOKIE = "al_rihla_journey_gates";

function clampGate(n: unknown): number {
  const v = typeof n === "number" ? n : typeof n === "string" ? parseInt(n, 10) : NaN;
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(GATES_TOTAL - 1, Math.floor(v)));
}

function clampCycle(n: unknown): number {
  const v = typeof n === "number" ? n : typeof n === "string" ? parseInt(n, 10) : NaN;
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1_000_000, Math.floor(v)));
}

export async function GET() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return NextResponse.json({ gatesLitThisCycle: 0, gateCycleIndex: 0 });
  try {
    const data = JSON.parse(raw) as { gatesLitThisCycle?: number; gateCycleIndex?: number };
    return NextResponse.json({
      gatesLitThisCycle: clampGate(data.gatesLitThisCycle),
      gateCycleIndex: clampCycle(data.gateCycleIndex)
    });
  } catch {
    return NextResponse.json({ gatesLitThisCycle: 0, gateCycleIndex: 0 });
  }
}

export async function POST(req: Request) {
  let body: { gatesLitThisCycle?: number; gateCycleIndex?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  const gatesLitThisCycle = clampGate(body.gatesLitThisCycle);
  const gateCycleIndex = clampCycle(body.gateCycleIndex);

  const payload = JSON.stringify({ gatesLitThisCycle, gateCycleIndex });
  const res = NextResponse.json({ ok: true, gatesLitThisCycle, gateCycleIndex });

  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, payload, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5
  });

  return res;
}

import { NextResponse } from "next/server";
import {
  clearOwnerSession,
  createOwnerSession,
  isOwner,
  passwordIsValid,
} from "@/lib/server/session";
import { requireSameOrigin, readJson } from "@/lib/server/http";
import { database } from "@/lib/server/supabase";

export async function GET() {
  return NextResponse.json({
    authenticated: await isOwner(),
    configured: Boolean(process.env.OWNER_PASSWORD),
  });
}

export async function POST(request: Request) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;
  const db = database();
  if (
    !db ||
    !process.env.OWNER_PASSWORD ||
    process.env.OWNER_PASSWORD.length < 20
  )
    return NextResponse.json(
      {
        error:
          "Finish database setup and configure an owner password of at least 20 characters.",
      },
      { status: 503 },
    );
  const { data: allowed, error } = await db.rpc("allow_owner_login");
  if (error)
    return NextResponse.json(
      { error: "Owner access is unavailable. Check the database migrations." },
      { status: 503 },
    );
  if (!allowed)
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  const body = await readJson(request);
  if (
    !body ||
    typeof body !== "object" ||
    !passwordIsValid((body as Record<string, unknown>).password)
  )
    return NextResponse.json(
      { error: "That owner password is not correct." },
      { status: 401 },
    );
  await createOwnerSession();
  return NextResponse.json({ authenticated: true });
}

export async function DELETE(request: Request) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;
  await clearOwnerSession();
  return NextResponse.json({ authenticated: false });
}

import { NextResponse } from "next/server";
import { fromRow, parseActivityInput, toRow } from "@/lib/server/activities";
import { isOwner } from "@/lib/server/session";
import { database } from "@/lib/server/supabase";
import { readJson, requireSameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = database();
  if (!db) return NextResponse.json({ configured: false, activities: [] });
  const params = new URL(request.url).searchParams;
  const since = params.get("since") ?? "1970-01-01T00:00:00.000Z";
  const offset = Number(params.get("offset") ?? 0);
  if (
    !/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|\+00:00)$/.test(since) ||
    !Number.isFinite(Date.parse(since)) ||
    !Number.isInteger(offset) ||
    offset < 0
  )
    return NextResponse.json(
      { error: "Invalid sync cursor." },
      { status: 400 },
    );
  const { data, error } = await db
    .from("activities")
    .select("*")
    .gte("updated_at", since)
    .order("updated_at")
    .order("id")
    .range(offset, offset + 499);
  if (error)
    return NextResponse.json(
      { error: "Progress data could not be loaded. Please retry." },
      { status: 502 },
    );
  const rows = data ?? [];
  return NextResponse.json(
    {
      configured: true,
      activities: rows.filter((row) => !row.deleted_at).map(fromRow),
      deletedIds: rows.filter((row) => row.deleted_at).map((row) => row.id),
      cursor: rows.at(-1)?.updated_at ?? since,
      nextOffset: rows.length === 500 ? offset + 500 : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;
  if (!(await isOwner()))
    return NextResponse.json(
      { error: "Owner access is required." },
      { status: 401 },
    );
  const db = database();
  if (!db)
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  const body = await readJson(request);
  const id =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).id
      : null;
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
  )
    return NextResponse.json(
      { error: "A valid activity ID is required." },
      { status: 400 },
    );
  const parsed = parseActivityInput(body);
  if (!parsed.data)
    return NextResponse.json(
      { error: parsed.errors.join(" ") },
      { status: 400 },
    );
  const { data, error } = await db
    .from("activities")
    .insert({ id, ...toRow(parsed.data) })
    .select("*")
    .single();
  if (error?.code === "23505") {
    const existing = await db
      .from("activities")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    if (
      existing.data &&
      JSON.stringify(toRow(fromRow(existing.data))) ===
        JSON.stringify(toRow(parsed.data))
    )
      return NextResponse.json({ activity: fromRow(existing.data) });
    return NextResponse.json(
      {
        error:
          "This activity was already saved with different values. Check History before retrying.",
      },
      { status: 409 },
    );
  }
  if (error)
    return NextResponse.json(
      { error: "The activity was not saved. Please retry." },
      { status: 502 },
    );
  return NextResponse.json({ activity: fromRow(data) }, { status: 201 });
}

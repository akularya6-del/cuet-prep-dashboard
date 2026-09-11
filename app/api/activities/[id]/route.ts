import { NextResponse } from "next/server";
import { fromRow, parseActivityInput, toRow } from "@/lib/server/activities";
import { isOwner } from "@/lib/server/session";
import { database } from "@/lib/server/supabase";
import { readJson, requireSameOrigin } from "@/lib/server/http";

const validId = (id: string) =>
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);
const validRevision = (value: string | null): value is string =>
  !!value &&
  /^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|\+00:00)$/.test(value) &&
  Number.isFinite(Date.parse(value));

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;
  if (!(await isOwner()))
    return NextResponse.json(
      { error: "Owner access is required." },
      { status: 401 },
    );
  const { id } = await context.params;
  if (!validId(id))
    return NextResponse.json(
      { error: "Invalid activity ID." },
      { status: 400 },
    );
  const db = database();
  if (!db)
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  const revision = request.headers.get("if-match");
  if (!validRevision(revision))
    return NextResponse.json(
      { error: "Refresh History before editing." },
      { status: 400 },
    );
  const parsed = parseActivityInput(await readJson(request));
  if (!parsed.data)
    return NextResponse.json(
      { error: parsed.errors.join(" ") },
      { status: 400 },
    );
  const { data, error } = await db
    .from("activities")
    .update(toRow(parsed.data))
    .eq("id", id)
    .eq("updated_at", revision)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "The activity was not updated. Please retry." },
      { status: 502 },
    );
  if (!data)
    return NextResponse.json(
      {
        error:
          "This activity changed on another device. Refresh History and reopen it; your correction has not been saved.",
      },
      { status: 409 },
    );
  return NextResponse.json({ activity: fromRow(data) });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;
  if (!(await isOwner()))
    return NextResponse.json(
      { error: "Owner access is required." },
      { status: 401 },
    );
  const { id } = await context.params;
  if (!validId(id))
    return NextResponse.json(
      { error: "Invalid activity ID." },
      { status: 400 },
    );
  const db = database();
  if (!db)
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  const revision = request.headers.get("if-match");
  if (!validRevision(revision))
    return NextResponse.json(
      { error: "Refresh History before deleting." },
      { status: 400 },
    );
  const { data, error } = await db
    .from("activities")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("updated_at", revision)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "The activity was not deleted. Please retry." },
      { status: 502 },
    );
  if (!data)
    return NextResponse.json(
      {
        error:
          "This activity changed on another device. Refresh History before deleting it.",
      },
      { status: 409 },
    );
  return NextResponse.json({ deleted: true });
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

test("PostgreSQL migrations: protected roles, persistent records, corrections, soft deletes and login limit", async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    for (const file of [
      "202609110001_create_activities.sql",
      "202609110002_audit_and_login.sql",
    ]) {
      await db.exec(
        readFileSync(
          new URL(`../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }
    const insert = await db.query<{ id: string }>(
      "insert into activities (occurred_on,type,subject_id,topic_ids) values ('2026-09-01','first-study','mathematics',array['topic']) returning id",
    );
    const id = insert.rows[0].id;
    assert.equal(
      (await db.query("select * from activities where id = $1", [id])).rows
        .length,
      1,
    );
    await db.query("update activities set notes = 'Corrected' where id = $1", [
      id,
    ]);
    const audit = await db.query<{ previous_record: { notes: string } }>(
      "select previous_record from activity_revisions where activity_id = $1",
      [id],
    );
    assert.equal(audit.rows[0].previous_record.notes, "");
    await db.query("update activities set deleted_at = now() where id = $1", [
      id,
    ]);
    assert.equal(
      (await db.query("select * from activities where deleted_at is null")).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query("select * from activities where id = $1", [id])).rows
        .length,
      1,
    );
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select * from activities"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select allow_owner_login()"),
      /permission denied/,
    );
    await db.exec("reset role");
    for (let index = 0; index < 10; index++)
      assert.equal(
        (
          await db.query<{ allowed: boolean }>(
            "select allow_owner_login() as allowed",
          )
        ).rows[0].allowed,
        true,
      );
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select allow_owner_login() as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    await db.exec(
      "update owner_login_limit set window_started = now() - interval '16 minutes'",
    );
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select allow_owner_login() as allowed",
        )
      ).rows[0].allowed,
      true,
    );
    await assert.rejects(
      db.query(
        "insert into activities(occurred_on,type,subject_id,topic_ids,questions_attempted,questions_correct) values ('2026-09-01','practice','mathematics',array['topic'],10,20)",
      ),
    );
  } finally {
    await db.close();
  }
});

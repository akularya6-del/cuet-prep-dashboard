import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  allTopics,
  normalizedTopicWeight,
  syllabus,
  validateSyllabus,
} from "../lib/syllabus";

test("the five official subjects and unique topics are present", () => {
  assert.equal(syllabus.length, 5);
  assert.ok(allTopics.length > 90);
  assert.equal(
    new Set(allTopics.map((topic) => topic.id)).size,
    allTopics.length,
  );
  assert.deepEqual(validateSyllabus(), []);
});

test("each subject weight normalizes to exactly one", () => {
  for (const subject of syllabus) {
    const total = subject.topics.reduce(
      (sum, topic) => sum + normalizedTopicWeight(topic),
      0,
    );
    assert.ok(Math.abs(total - 1) < 1e-10, `${subject.name}: ${total}`);
  }
});

test("the five published PDFs match the audited source hashes", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../data/source-pages.json", import.meta.url), "utf8"),
  ) as { file: string; sha256: string }[];
  assert.equal(manifest.length, 5);
  for (const source of manifest) {
    const published = readFileSync(
      new URL(`../public/syllabus/${source.file}`, import.meta.url),
    );
    assert.equal(
      createHash("sha256").update(published).digest("hex"),
      source.sha256,
      source.file,
    );
  }
});

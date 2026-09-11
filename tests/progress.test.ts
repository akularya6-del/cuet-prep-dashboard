import assert from "node:assert/strict";
import test from "node:test";
import {
  overallProgress,
  subjectProgress,
  topicProgress,
} from "../lib/progress";
import { syllabus } from "../lib/syllabus";
import type { Activity, ActivityType, SubjectId } from "../lib/types";

const topic = syllabus[0].topics[0];
let sequence = 0;
const activity = (
  type: ActivityType,
  overrides: Partial<Activity> = {},
): Activity => ({
  id: `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
  occurredOn: "2026-09-01",
  type,
  subjectId: topic.subjectId,
  topicIds: [topic.id],
  questionsAttempted: null,
  questionsCorrect: null,
  scorePercent: null,
  durationMinutes: null,
  confidence: null,
  recallNumber: null,
  notes: "",
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-01T10:00:00Z",
  ...overrides,
});

test("A: no activity means zero coverage and mastery", () => {
  assert.deepEqual(overallProgress([]).coverage, 0);
  assert.deepEqual(overallProgress([]).mastery, 0);
});

test("B-D: study, recall and strong practice increase mastery in order", () => {
  const studied = topicProgress(topic, [activity("first-study")], "2026-09-02");
  const recalled = topicProgress(
    topic,
    [activity("first-study"), activity("recall", { confidence: 4 })],
    "2026-09-02",
  );
  const practised = topicProgress(
    topic,
    [
      activity("first-study"),
      activity("recall", { confidence: 4 }),
      activity("practice", { questionsAttempted: 40, questionsCorrect: 34 }),
    ],
    "2026-09-02",
  );
  assert.equal(studied.coverage, 100);
  assert.ok(studied.mastery > 0 && studied.mastery < 40);
  assert.ok(recalled.mastery > studied.mastery);
  assert.ok(practised.mastery > recalled.mastery && practised.mastery < 85);
});

test("E: poor practice flags a covered topic as weak", () => {
  const result = topicProgress(
    topic,
    [
      activity("first-study"),
      activity("practice", { questionsAttempted: 40, questionsCorrect: 18 }),
    ],
    "2026-09-02",
  );
  assert.equal(result.status, "Weak");
});

test("F: strong test performance adds meaningful mastery", () => {
  const base = [activity("first-study"), activity("recall", { confidence: 4 })];
  const before = topicProgress(topic, base, "2026-09-02");
  const after = topicProgress(
    topic,
    [...base, activity("topic-test", { scorePercent: 91 })],
    "2026-09-02",
  );
  assert.ok(after.mastery > before.mastery + 10);
});

test("G: removing an event reconstructs the earlier result", () => {
  const study = activity("first-study");
  const recall = activity("recall");
  const withRecall = topicProgress(topic, [study, recall], "2026-09-02");
  const afterDelete = topicProgress(topic, [study], "2026-09-02");
  assert.ok(withRecall.mastery > afterDelete.mastery);
  assert.equal(afterDelete.recallCount, 0);
});

test("H: subjects aggregate independently", () => {
  const chemistryTopic = syllabus[1].topics[0];
  const events = [
    activity("first-study"),
    activity("first-study", {
      subjectId: "chemistry",
      topicIds: [chemistryTopic.id],
    }),
  ];
  assert.ok(subjectProgress("mathematics", events).coverage > 0);
  assert.ok(subjectProgress("chemistry", events).coverage > 0);
  assert.equal(subjectProgress("english", events).coverage, 0);
});

test("all progress stays within valid bounds", () => {
  const events = Array.from({ length: 20 }, (_, index) =>
    activity(index % 2 ? "recall" : "topic-test", {
      scorePercent: 100,
      confidence: 5,
    }),
  );
  const result = topicProgress(topic, events, "2026-09-02");
  assert.ok(result.coverage >= 0 && result.coverage <= 100);
  assert.ok(result.mastery >= 0 && result.mastery <= 100);
});

import assert from "node:assert/strict";
import test from "node:test";
import { allTopics, syllabus } from "../lib/syllabus";
import {
  dailySummary,
  overallProgress,
  recallContribution,
  topicProgress,
} from "../lib/progress";
import { parseActivityInput } from "../lib/server/activities";
import type { Activity } from "../lib/types";

const topic = syllabus[0].topics[0];
const base: Activity = {
  id: "00000000-0000-4000-8000-000000000001",
  type: "first-study",
  subjectId: topic.subjectId,
  topicIds: [topic.id],
  occurredOn: "2026-09-01",
  createdAt: "2026-09-01T12:00:00Z",
  updatedAt: "2026-09-01T12:00:00Z",
  questionsAttempted: null,
  questionsCorrect: null,
  scorePercent: null,
  durationMinutes: null,
  confidence: null,
  recallNumber: null,
  notes: "",
};

test("newest tests receive highest weight regardless of API order", () => {
  const events = [
    base,
    ...[54, 71, 84, 91].map((scorePercent, i): Activity => ({
      ...base,
      id: String(i),
      type: "topic-test",
      occurredOn: `2026-09-0${i + 2}`,
      scorePercent,
    })),
  ];
  const expected = (54 + 71 * 2 + 84 * 3 + 91 * 4) / 10;
  assert.equal(
    topicProgress(topic, events, "2026-09-06").testAverage,
    expected,
  );
  assert.deepEqual(
    topicProgress(topic, events, "2026-09-06"),
    topicProgress(topic, events.toReversed(), "2026-09-06"),
  );
});

test("multi-topic practice conserves question totals and daily study counts", () => {
  const ids = syllabus[0].topics.slice(0, 2).map((item) => item.id);
  const events: Activity[] = [
    { ...base, topicIds: ids },
    {
      ...base,
      topicIds: ids,
      type: "practice",
      questionsAttempted: 40,
      questionsCorrect: 34,
    },
  ];
  const stats = ids.map((id) =>
    topicProgress(
      allTopics.find((topic) => topic.id === id)!,
      events,
      "2026-09-01",
    ),
  );
  assert.equal(
    stats.reduce((sum, topic) => sum + topic.questionsAttempted, 0),
    40,
  );
  assert.equal(
    stats.reduce((sum, topic) => sum + topic.questionsCorrect, 0),
    34,
  );
  assert.equal(dailySummary(events, "2026-09-01").studied, 2);
});

test("recall saturates and low confidence is not a successful recall", () => {
  assert.ok(
    recallContribution(1) > recallContribution(8) - recallContribution(7),
  );
  assert.ok(recallContribution(100) <= 30);
  assert.equal(
    topicProgress(
      topic,
      [base, { ...base, type: "recall", confidence: 1 }],
      "2026-09-01",
    ).mastery,
    25,
  );
});

test("zero accuracy adds no mastery and future events are consistently excluded", () => {
  const events: Activity[] = [
    base,
    { ...base, type: "practice", questionsAttempted: 100, questionsCorrect: 0 },
    { ...base, type: "topic-test", scorePercent: 0 },
  ];
  assert.equal(topicProgress(topic, events, "2026-09-01").mastery, 25);
  assert.equal(overallProgress(events, "2026-08-31").coverage, 0);
  assert.equal(
    overallProgress(events, "2026-08-31").subjects[0].questionsAttempted,
    0,
  );
});

test("validation rejects impossible dates, malformed counts and scores", () => {
  for (const overrides of [
    { occurredOn: "2026-02-30" },
    { occurredOn: "2099-01-01" },
    { type: "practice", questionsAttempted: 3.2, questionsCorrect: 2 },
    { type: "practice" },
    { type: "topic-test" },
    { type: "practice", questionsAttempted: 20, questionsCorrect: 30 },
    { topicIds: [syllabus[1].topics[0].id] },
    { notes: "x".repeat(4001) },
    { durationMinutes: -1 },
    { confidence: 6 },
    { scorePercent: NaN },
  ]) {
    assert.ok(
      parseActivityInput({ ...base, ...overrides }).errors.length,
      JSON.stringify(overrides),
    );
  }
  assert.deepEqual(parseActivityInput(base).errors, []);
});

test("all studied topics yield exactly 100% coverage in every subject", () => {
  const events = allTopics.map((topic) => ({
    ...base,
    id: topic.id,
    subjectId: topic.subjectId,
    topicIds: [topic.id],
  }));
  for (const subject of overallProgress(events, "2026-09-01").subjects)
    assert.ok(Math.abs(subject.coverage - 100) < 1e-10);
});

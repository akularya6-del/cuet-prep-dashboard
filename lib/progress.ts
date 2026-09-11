import {
  allTopics,
  normalizedTopicWeight,
  syllabus,
  topicById,
} from "./syllabus";
import type {
  Activity,
  SubjectId,
  SubjectProgress,
  SyllabusTopic,
  TopicProgress,
} from "./types";
import { today as studyToday, validStudyDate } from "./dates";

const TEST_TYPES = new Set([
  "topic-test",
  "section-test",
  "subject-test",
  "mock-test",
]);
const DAY = 86_400_000;

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));
const dateMs = (value: string) =>
  new Date(`${value.slice(0, 10)}T12:00:00Z`).getTime();
const daysBetween = (from: string, to: string) =>
  Math.max(0, Math.floor((dateMs(to) - dateMs(from)) / DAY));
const accuracyOf = (activity: Activity) => {
  if (activity.scorePercent !== null) return clamp(activity.scorePercent) / 100;
  if (activity.questionsAttempted && activity.questionsCorrect !== null)
    return clamp(activity.questionsCorrect / activity.questionsAttempted, 0, 1);
  return null;
};

export function topicProgress(
  topic: SyllabusTopic,
  activities: Activity[],
  asOf = studyToday(),
): TopicProgress {
  const events = activities
    .filter(
      (activity) =>
        activity.topicIds.includes(topic.id) && activity.occurredOn <= asOf,
    )
    .sort(
      (a, b) =>
        a.occurredOn.localeCompare(b.occurredOn) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
  const firstStudy = events.filter((event) => event.type === "first-study");
  const revisions = events.filter((event) => event.type === "revision");
  const recalls = events.filter((event) => event.type === "recall");
  const practices = events.filter((event) => event.type === "practice");
  const tests = events.filter((event) => TEST_TYPES.has(event.type));
  const directLearning =
    firstStudy.length > 0 || revisions.length > 0 || recalls.length > 0;
  const appliedExposure = practices.length > 0 || tests.length > 0;
  const coverage = directLearning ? 100 : appliedExposure ? 60 : 0;

  const learning = firstStudy.length
    ? 25
    : revisions.length || recalls.length
      ? 20
      : appliedExposure
        ? 10
        : 0;
  // A confidence of 1 records an unsuccessful attempt without awarding recall points.
  const recallEvidence = recalls.reduce(
    (sum, event) =>
      sum + (event.confidence === null ? 0.8 : (event.confidence - 1) / 4),
    0,
  );
  const lastRecall =
    recalls
      .map((event) => event.occurredOn)
      .sort()
      .at(-1) ?? null;
  const recallInterval = [0, 7, 21, 45, 90, 150][Math.min(recalls.length, 5)];
  const daysSinceRecall = lastRecall ? daysBetween(lastRecall, asOf) : 0;
  const freshness =
    lastRecall && daysSinceRecall > recallInterval
      ? Math.max(0.65, 1 - (daysSinceRecall - recallInterval) / 360)
      : 1;
  const recall = recallContribution(recallEvidence, freshness);

  // Shared session totals are allocated evenly, never awarded in full to every topic.
  const questionsAttempted = practices.reduce(
    (sum, event) =>
      sum + (event.questionsAttempted ?? 0) / event.topicIds.length,
    0,
  );
  const questionsCorrect = practices.reduce(
    (sum, event) => sum + (event.questionsCorrect ?? 0) / event.topicIds.length,
    0,
  );
  const practiceAccuracy = questionsAttempted
    ? questionsCorrect / questionsAttempted
    : null;
  const practice = practiceContribution(questionsAttempted, practiceAccuracy);

  const scoredTests = tests
    .map(accuracyOf)
    .filter((score): score is number => score !== null)
    .slice(-5);
  const weightedTestAverage = scoredTests.length
    ? scoredTests.reduce((sum, score, index) => sum + score * (index + 1), 0) /
      scoredTests.reduce((sum, _, index) => sum + index + 1, 0)
    : null;
  const testing = testContribution(scoredTests.length, weightedTestAverage);
  const mastery = clamp(learning + recall + practice + testing);

  const studyDates = [...firstStudy, ...revisions]
    .map((event) => event.occurredOn)
    .sort();
  const lastStudied = studyDates.at(-1) ?? null;
  const recallDue =
    Boolean(lastStudied) &&
    (recalls.length === 0
      ? daysBetween(lastStudied!, asOf) >= 7
      : daysSinceRecall > recallInterval);
  const evidenceAccuracy = weightedTestAverage ?? practiceAccuracy;
  const weak =
    coverage > 0 &&
    ((evidenceAccuracy !== null && evidenceAccuracy < 0.65) ||
      (practiceAccuracy !== null && practiceAccuracy < 0.65));

  let status: TopicProgress["status"] = "Not started";
  if (coverage > 0) status = "Started";
  if (coverage === 100) status = "Covered";
  if (recalls.length) status = "Recalled";
  if (practices.length) status = "Practising";
  if (recallDue) status = "Recall due";
  if (weak) status = "Weak";
  if (mastery >= 70 && !weak && !recallDue) status = "Strong";
  if (mastery >= 85 && !weak && !recallDue) status = "Mastered";

  return {
    topicId: topic.id,
    coverage,
    mastery,
    status,
    recallCount: recalls.length,
    questionsAttempted,
    questionsCorrect,
    accuracy: practiceAccuracy === null ? null : practiceAccuracy * 100,
    testAverage:
      weightedTestAverage === null ? null : weightedTestAverage * 100,
    testCount: tests.length,
    lastStudied,
    lastRecalled: lastRecall,
  };
}

export function recallContribution(evidence: number, freshness = 1): number {
  return (
    30 * (1 - Math.exp(-0.7 * Math.max(0, evidence))) * clamp(freshness, 0, 1)
  );
}

export function practiceContribution(
  questions: number,
  accuracy: number | null,
): number {
  return accuracy === null
    ? 0
    : 20 *
        Math.min(1, Math.sqrt(Math.max(0, questions) / 100)) *
        clamp(accuracy, 0, 1);
}

export function testContribution(
  attempts: number,
  accuracy: number | null,
): number {
  return accuracy === null || attempts === 0
    ? 0
    : 25 *
        Math.min(1, 0.55 + Math.max(0, attempts - 1) * 0.15) *
        clamp(accuracy, 0, 1);
}

export function subjectProgress(
  subjectId: SubjectId,
  activities: Activity[],
  asOf = studyToday(),
): SubjectProgress {
  const subject = syllabus.find((item) => item.id === subjectId)!;
  const topicStats = subject.topics.map((topic) => ({
    topic,
    progress: topicProgress(topic, activities, asOf),
  }));
  const coverage = topicStats.reduce(
    (sum, item) =>
      sum + item.progress.coverage * normalizedTopicWeight(item.topic),
    0,
  );
  const mastery = topicStats.reduce(
    (sum, item) =>
      sum + item.progress.mastery * normalizedTopicWeight(item.topic),
    0,
  );
  const subjectActivities = activities.filter(
    (activity) =>
      activity.subjectId === subjectId &&
      (!asOf || activity.occurredOn <= asOf),
  );
  const practices = subjectActivities.filter(
    (activity) => activity.type === "practice",
  );
  const questionsAttempted = practices.reduce(
    (sum, event) => sum + (event.questionsAttempted ?? 0),
    0,
  );
  const questionsCorrect = practices.reduce(
    (sum, event) => sum + (event.questionsCorrect ?? 0),
    0,
  );
  return {
    subjectId,
    coverage,
    mastery,
    recalledTopics: topicStats.filter((item) => item.progress.recallCount > 0)
      .length,
    questionsAttempted,
    questionsCorrect,
    accuracy: questionsAttempted
      ? (questionsCorrect / questionsAttempted) * 100
      : null,
    tests: subjectActivities.filter((activity) => TEST_TYPES.has(activity.type))
      .length,
  };
}

export function overallProgress(activities: Activity[], asOf?: string) {
  const subjects = syllabus.map((subject) =>
    subjectProgress(subject.id, activities, asOf),
  );
  // Equal subject weights prevent a longer PDF from dominating the overall score.
  return {
    coverage:
      subjects.reduce((sum, subject) => sum + subject.coverage, 0) /
      subjects.length,
    mastery:
      subjects.reduce((sum, subject) => sum + subject.mastery, 0) /
      subjects.length,
    subjects,
  };
}

export function progressTimeline(activities: Activity[]) {
  const dates = [
    ...new Set(activities.map((activity) => activity.occurredOn)),
  ].sort();
  return dates.map((date) => ({ date, ...overallProgress(activities, date) }));
}

export function dailySummary(activities: Activity[], date = studyToday()) {
  const today = activities.filter((activity) => activity.occurredOn === date);
  const previousDate = new Date(dateMs(date) - DAY).toISOString().slice(0, 10);
  const current = overallProgress(activities, date);
  const previous = overallProgress(activities, previousDate);
  const practices = today.filter((activity) => activity.type === "practice");
  const attempted = practices.reduce(
    (sum, event) => sum + (event.questionsAttempted ?? 0),
    0,
  );
  const correct = practices.reduce(
    (sum, event) => sum + (event.questionsCorrect ?? 0),
    0,
  );
  return {
    studied: new Set(
      today
        .filter(
          (activity) =>
            activity.type === "first-study" || activity.type === "revision",
        )
        .flatMap((activity) => activity.topicIds),
    ).size,
    recalls: today.filter((activity) => activity.type === "recall").length,
    attempted,
    accuracy: attempted ? (correct / attempted) * 100 : null,
    coverageGain: current.coverage - previous.coverage,
    masteryGain: current.mastery - previous.mastery,
  };
}

export function recommendTopics(
  activities: Activity[],
  limit = 5,
  asOf = studyToday(),
) {
  return allTopics
    .map((topic) => {
      const progress = topicProgress(topic, activities, asOf);
      const weight = normalizedTopicWeight(topic);
      let score = weight * 100;
      let reason = "Not studied yet.";
      if (progress.status === "Weak") {
        score += 180;
        reason =
          progress.testAverage !== null && progress.testAverage < 65
            ? `Test average is ${progress.testAverage.toFixed(0)}%.`
            : `Practice accuracy is ${(progress.accuracy ?? 0).toFixed(0)}%.`;
      } else if (progress.status === "Recall due") {
        score += 150;
        reason = progress.recallCount
          ? `Recall #${progress.recallCount + 1} is due.`
          : "Covered, but no recall is recorded.";
      } else if (progress.coverage === 0) {
        score += 100 - topic.order * 0.05;
      } else if (progress.mastery < 70) {
        score += 70 - progress.mastery;
        reason =
          "Covered, but more practice or testing would strengthen mastery.";
      }
      return { topic, progress, score, reason };
    })
    .filter((item) => item.progress.status !== "Mastered")
    .sort((a, b) => b.score - a.score || a.topic.order - b.topic.order)
    .slice(0, limit);
}

export function validateActivity(
  activity: Omit<Activity, "id" | "createdAt" | "updatedAt">,
): string[] {
  const errors: string[] = [];
  if (!validStudyDate(activity.occurredOn))
    errors.push("Use a real date from 2000 through today (India time).");
  for (const value of [
    activity.questionsAttempted,
    activity.questionsCorrect,
    activity.durationMinutes,
    activity.recallNumber,
    activity.confidence,
  ]) {
    if (
      value !== null &&
      (!Number.isInteger(value) || value < 0 || value > 1000000)
    )
      errors.push("Counts must be whole non-negative numbers up to 1,000,000.");
  }
  if (activity.recallNumber !== null && activity.recallNumber < 1)
    errors.push("Recall number starts at 1.");
  if (
    activity.type === "practice" &&
    (!(activity.questionsAttempted! > 0) || activity.questionsCorrect === null)
  )
    errors.push("Practice requires attempted and correct question counts.");
  if (
    TEST_TYPES.has(activity.type) &&
    activity.scorePercent === null &&
    !(activity.questionsAttempted! > 0 && activity.questionsCorrect !== null)
  )
    errors.push("A test needs a score or attempted and correct counts.");
  if (!syllabus.some((subject) => subject.id === activity.subjectId))
    errors.push("Choose a valid subject.");
  if (!activity.topicIds.length)
    errors.push("Choose at least one syllabus topic.");
  if (
    activity.topicIds.some(
      (id) => topicById.get(id)?.subjectId !== activity.subjectId,
    )
  )
    errors.push("Every topic must belong to the selected subject.");
  if (activity.questionsAttempted !== null && activity.questionsAttempted < 0)
    errors.push("Questions attempted cannot be negative.");
  if (activity.questionsCorrect !== null && activity.questionsCorrect < 0)
    errors.push("Questions correct cannot be negative.");
  if (
    activity.questionsAttempted !== null &&
    activity.questionsCorrect !== null &&
    activity.questionsCorrect > activity.questionsAttempted
  )
    errors.push("Questions correct cannot exceed attempted.");
  if (
    activity.scorePercent !== null &&
    (activity.scorePercent < 0 || activity.scorePercent > 100)
  )
    errors.push("Score must be between 0 and 100.");
  if (
    activity.confidence !== null &&
    (activity.confidence < 1 || activity.confidence > 5)
  )
    errors.push("Confidence must be from 1 to 5.");
  return errors;
}

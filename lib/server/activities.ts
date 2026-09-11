import {
  ACTIVITY_TYPES,
  SUBJECT_IDS,
  type Activity,
  type ActivityType,
  type SubjectId,
} from "../types";
import { validateActivity } from "../progress";

type ActivityInput = Omit<Activity, "id" | "createdAt" | "updatedAt">;

const finiteOrNull = (value: unknown) =>
  value === null || value === "" || value === undefined
    ? null
    : typeof value === "number" && Number.isFinite(value)
      ? value
      : NaN;

export function parseActivityInput(value: unknown): {
  data?: ActivityInput;
  errors: string[];
} {
  if (!value || typeof value !== "object")
    return { errors: ["Invalid activity."] };
  const body = value as Record<string, unknown>;
  const occurredOn = typeof body.occurredOn === "string" ? body.occurredOn : "";
  const type = body.type as ActivityType;
  const subjectId = body.subjectId as SubjectId;
  const topicIds = Array.isArray(body.topicIds)
    ? [
        ...new Set(
          body.topicIds.filter((id): id is string => typeof id === "string"),
        ),
      ]
    : [];
  const data: ActivityInput = {
    occurredOn,
    type,
    subjectId,
    topicIds,
    questionsAttempted: finiteOrNull(body.questionsAttempted),
    questionsCorrect: finiteOrNull(body.questionsCorrect),
    scorePercent: finiteOrNull(body.scorePercent),
    durationMinutes: finiteOrNull(body.durationMinutes),
    confidence: finiteOrNull(body.confidence),
    recallNumber: finiteOrNull(body.recallNumber),
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
  };
  const errors: string[] = [];
  if (data.notes.length > 4000)
    errors.push("Notes must be 4,000 characters or fewer.");
  if (
    topicIds.length > 500 ||
    !Array.isArray(body.topicIds) ||
    body.topicIds.some((id) => typeof id !== "string")
  )
    errors.push("Invalid topic selection.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn) ||
    Number.isNaN(dateValue(occurredOn))
  )
    errors.push("Choose a valid date.");
  if (!ACTIVITY_TYPES.includes(type))
    errors.push("Choose a valid activity type.");
  if (!SUBJECT_IDS.includes(subjectId)) errors.push("Choose a valid subject.");
  for (const field of [
    data.questionsAttempted,
    data.questionsCorrect,
    data.scorePercent,
    data.durationMinutes,
    data.confidence,
    data.recallNumber,
  ]) {
    if (Number.isNaN(field))
      errors.push("Numeric fields must contain valid numbers.");
  }
  if (!errors.length) errors.push(...validateActivity(data));
  return errors.length ? { errors } : { data, errors };
}

const dateValue = (date: string) => new Date(`${date}T12:00:00Z`).getTime();

export function toRow(activity: ActivityInput) {
  return {
    occurred_on: activity.occurredOn,
    type: activity.type,
    subject_id: activity.subjectId,
    topic_ids: activity.topicIds,
    questions_attempted: activity.questionsAttempted,
    questions_correct: activity.questionsCorrect,
    score_percent: activity.scorePercent,
    duration_minutes: activity.durationMinutes,
    confidence: activity.confidence,
    recall_number: activity.recallNumber,
    notes: activity.notes,
  };
}

export function fromRow(row: Record<string, unknown>): Activity {
  return {
    id: String(row.id),
    occurredOn: String(row.occurred_on),
    type: row.type as ActivityType,
    subjectId: row.subject_id as SubjectId,
    topicIds: row.topic_ids as string[],
    questionsAttempted: row.questions_attempted as number | null,
    questionsCorrect: row.questions_correct as number | null,
    scorePercent: row.score_percent as number | null,
    durationMinutes: row.duration_minutes as number | null,
    confidence: row.confidence as number | null,
    recallNumber: row.recall_number as number | null,
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

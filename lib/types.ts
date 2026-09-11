export const SUBJECT_IDS = [
  "mathematics",
  "chemistry",
  "english",
  "physical-education",
  "gat",
] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];

export const ACTIVITY_TYPES = [
  "first-study",
  "revision",
  "recall",
  "practice",
  "topic-test",
  "section-test",
  "subject-test",
  "mock-test",
  "other",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type SyllabusTopic = {
  id: string;
  subjectId: SubjectId;
  unitId: string;
  unit: string;
  title: string;
  officialWording: string;
  parentId: string;
  order: number;
  rawWeight: number;
  sourceFile: string;
  sourcePage: number;
};

export type SyllabusSubject = {
  id: SubjectId;
  name: string;
  shortName: string;
  code: string;
  color: string;
  sourceFile: string;
  structureNote: string;
  topics: SyllabusTopic[];
};

export type Activity = {
  id: string;
  occurredOn: string;
  type: ActivityType;
  subjectId: SubjectId;
  topicIds: string[];
  questionsAttempted: number | null;
  questionsCorrect: number | null;
  scorePercent: number | null;
  durationMinutes: number | null;
  confidence: number | null;
  recallNumber: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TopicProgress = {
  topicId: string;
  coverage: number;
  mastery: number;
  status:
    | "Not started"
    | "Started"
    | "Covered"
    | "Recall due"
    | "Recalled"
    | "Practising"
    | "Weak"
    | "Strong"
    | "Mastered";
  recallCount: number;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number | null;
  testAverage: number | null;
  testCount: number;
  lastStudied: string | null;
  lastRecalled: string | null;
};

export type SubjectProgress = {
  subjectId: SubjectId;
  coverage: number;
  mastery: number;
  recalledTopics: number;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number | null;
  tests: number;
};

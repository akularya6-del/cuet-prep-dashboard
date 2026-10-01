import { createHash } from "node:crypto";
import { parseActivityInput } from "../lib/server/activities";
import { syllabus } from "../lib/syllabus";
import type { ActivityType, SubjectId } from "../lib/types";

const origin = "https://progress-peach-delta.vercel.app";

const subjectTopics = (subjectId: SubjectId) =>
  syllabus.find((subject) => subject.id === subjectId)!.topics;

const topic = (subjectId: SubjectId, title: string) => {
  const match = subjectTopics(subjectId).find((item) => item.title === title);
  if (!match) throw new Error(`Unknown topic: ${subjectId}/${title}`);
  return match.id;
};

const gatNumerical = topic("gat", "Numerical ability");
const gatQuantitative = topic("gat", "Quantitative reasoning");
const gatLogical = topic("gat", "Logical reasoning");
const gatGk = topic("gat", "General knowledge");
const mathInverseTrig = topic("mathematics", "Inverse trigonometric functions");
const chemistryPosition = topic("chemistry", "Position and electronic configuration");
const englishFactual = topic("english", "Factual passages");
const englishWord = topic("english", "Choosing the correct word");
const englishVocab = topic("english", "Synonyms and antonyms");

type Input = {
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
};

const stableId = (key: string) => {
  const bytes = Buffer.from(createHash("sha256").update(`cuet-progress:${key}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const make = (
  key: string,
  occurredOn: string,
  type: ActivityType,
  subjectId: SubjectId,
  topicIds: string[],
  fields: Partial<Omit<Input, "occurredOn" | "type" | "subjectId" | "topicIds">> & { notes: string },
) => ({
  id: stableId(key),
  occurredOn,
  type,
  subjectId,
  topicIds,
  questionsAttempted: null,
  questionsCorrect: null,
  scorePercent: null,
  durationMinutes: null,
  confidence: null,
  recallNumber: null,
  ...fields,
});

const physicalChemistry = [
  topic("chemistry", "Types and concentration of solutions"),
  topic("chemistry", "Electrochemical cells"),
  topic("chemistry", "Reaction rates and rate law"),
];
const organicChemistry = [
  topic("chemistry", "Classification and preparation"),
  topic("chemistry", "Physical and chemical properties"),
  topic("chemistry", "Carbonyl compounds"),
  topic("chemistry", "Amines"),
  topic("chemistry", "Carbohydrates"),
];
const allPhysicalEducation = subjectTopics("physical-education").map((item) => item.id);

const activities = [
  make("legacy-20260907-gat-arithmetic", "2026-09-07", "topic-test", "gat", [gatNumerical], {
    questionsAttempted: 10, questionsCorrect: 8,
    notes: "Imported from CUET-OS immutable diagnostic baseline: G-ARITH, 8/10. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-gat-di", "2026-09-07", "topic-test", "gat", [gatQuantitative], {
    questionsAttempted: 1, questionsCorrect: 1,
    notes: "Imported from CUET-OS immutable diagnostic baseline: G-DI, 1/1. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-gat-gk", "2026-09-07", "topic-test", "gat", [gatGk], {
    questionsAttempted: 4, questionsCorrect: 2,
    notes: "Imported from CUET-OS immutable diagnostic baseline: G-GK, 2/4. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-gat-logic", "2026-09-07", "topic-test", "gat", [gatLogical], {
    questionsAttempted: 6, questionsCorrect: 6,
    notes: "Imported from CUET-OS immutable diagnostic baseline: G-LR, 6/6. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-maths-foundation", "2026-09-07", "other", "gat", [gatQuantitative], {
    notes: "CUET-OS legacy Maths foundation diagnostic spans arithmetic, algebra, geometry and statistics. Preserved as history only because overlapping rung counts cannot be reconciled; no official-topic progress awarded.",
  }),
  make("legacy-20260907-chem-physical", "2026-09-07", "section-test", "chemistry", physicalChemistry, {
    questionsAttempted: 5, questionsCorrect: 2,
    notes: "Imported from CUET-OS immutable diagnostic baseline: C-PHYS, 2/5 across representative physical-chemistry units. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-chem-organic", "2026-09-07", "section-test", "chemistry", organicChemistry, {
    questionsAttempted: 5, questionsCorrect: 3,
    notes: "Imported from CUET-OS immutable diagnostic baseline: C-ORG, 3/5 across representative organic-chemistry units. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-chem-inorganic", "2026-09-07", "topic-test", "chemistry", [chemistryPosition], {
    questionsAttempted: 5, questionsCorrect: 0,
    notes: "Imported from CUET-OS immutable diagnostic baseline: C-INORG, 0/5. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-english-rc", "2026-09-07", "topic-test", "english", [englishFactual], {
    questionsAttempted: 5, questionsCorrect: 5,
    notes: "Imported from CUET-OS immutable diagnostic baseline: E-RC, 5/5; passage subtype was not preserved. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-english-vocab", "2026-09-07", "topic-test", "english", [englishVocab], {
    questionsAttempted: 8, questionsCorrect: 6,
    notes: "Imported from CUET-OS immutable diagnostic baseline: E-VOCAB, 6/8. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-english-grammar", "2026-09-07", "topic-test", "english", [englishWord], {
    questionsAttempted: 7, questionsCorrect: 5,
    notes: "Imported from CUET-OS immutable diagnostic baseline: E-GRAMMAR, 5/7; mapped to the closest official verbal-ability topic. [LEGACY ARTIFACT]",
  }),
  make("legacy-20260907-pe", "2026-09-07", "subject-test", "physical-education", allPhysicalEducation, {
    questionsAttempted: 10, questionsCorrect: 4,
    notes: "Imported from CUET-OS immutable diagnostic baseline: PE-SYLL, 4/10 broad syllabus diagnostic. [LEGACY ARTIFACT]",
  }),

  make("study-B-20260909-111352", "2026-09-09", "other", "mathematics", [mathInverseTrig], {
    durationMinutes: 62, questionsAttempted: 15, questionsCorrect: 11,
    notes: "CUET-OS: trigonometric-ratio prerequisite work, 11/15; errors corrected on fresh retest. History only—does not claim official inverse-trigonometric coverage.",
  }),
  make("study-B-20260909-132538", "2026-09-09", "other", "mathematics", [mathInverseTrig], {
    durationMinutes: 122, questionsAttempted: 19, questionsCorrect: 19,
    notes: "CUET-OS: trigonometric applications and standard-angle prerequisite work, 19/19. History only—does not claim official inverse-trigonometric coverage.",
  }),
  make("study-B-20260909-153748-learn", "2026-09-09", "first-study", "chemistry", [chemistryPosition], {
    durationMinutes: 54,
    notes: "CUET-OS: d-block foundations; transition-metal definition and Cr/Cu exceptions repaired through source-based retrieval.",
  }),
  make("study-B-20260909-153748-practice", "2026-09-09", "practice", "chemistry", [chemistryPosition], {
    questionsAttempted: 18, questionsCorrect: 13,
    notes: "Practice evidence from CUET-OS d-block foundation session, 13/18.",
  }),
  make("study-B-20260909-155320", "2026-09-09", "topic-test", "gat", [gatLogical], {
    durationMinutes: 15, questionsAttempted: 11, questionsCorrect: 9,
    notes: "CUET-OS logical-reasoning diagnostic, 9/11; syllogism and direction errors corrected on immediate retest.",
  }),
  make("study-B-20260909-192145-learn", "2026-09-09", "first-study", "gat", [gatQuantitative], {
    durationMinutes: 63,
    notes: "CUET-OS: arithmetic-progression nth term and sum, mapped to official GAT quantitative algebra.",
  }),
  make("study-B-20260909-192145-practice", "2026-09-09", "practice", "gat", [gatQuantitative], {
    questionsAttempted: 15, questionsCorrect: 15,
    notes: "CUET-OS arithmetic-progression practice, 15/15; one decimal-division slip self-corrected.",
  }),
  make("study-B-20260909-200115", "2026-09-09", "topic-test", "gat", [gatQuantitative], {
    durationMinutes: 33, questionsAttempted: 15, questionsCorrect: 14,
    notes: "CUET-OS algebra-foundations diagnostic, 14/15; identity-expansion slip corrected. Mapped to official GAT quantitative algebra.",
  }),
  make("study-B-20260910-140145", "2026-09-10", "recall", "english", [englishVocab], {
    durationMinutes: 33, confidence: 4, recallNumber: 1,
    notes: "CUET-OS synonyms/antonyms retrieval; one flawed item voided and hostile → antagonistic refined.",
  }),
  make("study-B-20260910-141900-learn", "2026-09-10", "first-study", "gat", [gatGk], {
    durationMinutes: 7,
    notes: "CUET-OS static-GK foundation retrieval; immediate gap repaired.",
  }),
  make("study-B-20260910-141900-practice", "2026-09-10", "practice", "gat", [gatGk], {
    questionsAttempted: 6, questionsCorrect: 6,
    notes: "CUET-OS static-GK same-session retrieval after repair, 6/6.",
  }),

  make("bootcamp-20260910-day1-learn", "2026-09-10", "first-study", "gat", [gatNumerical, gatQuantitative], {
    durationMinutes: 180,
    notes: "Maths Foundation Bootcamp Day 1: numbers, arithmetic, number sets, divisibility, prime factorisation, factors, cyclicity, HCF and LCM. Mapped to official GAT numerical ability and quantitative arithmetic.",
  }),
  make("bootcamp-20260910-day1-practice", "2026-09-10", "practice", "gat", [gatNumerical, gatQuantitative], {
    questionsAttempted: 5, questionsCorrect: 5,
    notes: "Day 1 visible concept checks: cyclicity, total factors, even/odd factors, and HCF/LCM applications; 5/5 after interactive teaching.",
  }),
  make("bootcamp-20260910-day1-test", "2026-09-10", "topic-test", "gat", [gatNumerical, gatQuantitative], {
    questionsAttempted: 10, questionsCorrect: 10,
    notes: "Day 1 baseline diagnostic completed independently, 10/10.",
  }),

  make("bootcamp-20260911-day2-revision", "2026-09-11", "revision", "gat", [gatNumerical, gatQuantitative], {
    durationMinutes: 97,
    notes: "Maths Foundation Bootcamp Day 2: fractions, recurring decimals, percentage conversions, reverse percentages, successive changes, product constancy and pass-mark boundaries. Duration excludes the reported ~15-minute break.",
  }),
  make("bootcamp-20260911-day2-recall", "2026-09-11", "recall", "gat", [gatNumerical, gatQuantitative], {
    questionsAttempted: 5, questionsCorrect: 5, confidence: 5, recallNumber: 1,
    notes: "Day 2 warm-up retrieval of Day 1 material, 5/5.",
  }),
  make("bootcamp-20260911-day2-practice", "2026-09-11", "practice", "gat", [gatNumerical, gatQuantitative], {
    questionsAttempted: 18, questionsCorrect: 15,
    notes: "Day 2 diagnostic and guided/timed work excluding the final validation: 15/18; recurring-decimal and product-constancy gaps were repaired.",
  }),
  make("bootcamp-20260911-day2-validation", "2026-09-11", "topic-test", "gat", [gatNumerical, gatQuantitative], {
    questionsAttempted: 6, questionsCorrect: 5,
    notes: "Fresh unseen Day 2 validation, 5/6 (83.33%); independent pass-mark boundary solution. Missed product-constancy item was followed by a correct 1/1 repair check.",
  }),
];

for (const activity of activities) {
  const parsed = parseActivityInput(activity);
  if (!parsed.data) throw new Error(`${activity.id}: ${parsed.errors.join(" ")}`);
}

async function main() {
  const mode = process.argv[2] ?? "--dry-run";
  if (mode === "--dry-run") {
    console.log(`Validated ${activities.length} deterministic activities.`);
    return;
  }

  const password = process.env.OWNER_PASSWORD;
  if (!password) throw new Error("OWNER_PASSWORD is unavailable.");

  const login = await fetch(`${origin}/api/session`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ password }),
  });
  if (!login.ok) throw new Error(`Owner login failed with HTTP ${login.status}.`);
  const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
  if (!cookie) throw new Error("Owner login did not return a session cookie.");

  if (mode === "--apply") {
    let created = 0;
    let existing = 0;
    for (const activity of activities) {
      const response = await fetch(`${origin}/api/activities`, {
        method: "POST",
        headers: { "content-type": "application/json", origin, cookie },
        body: JSON.stringify(activity),
      });
      if (response.status === 201) created += 1;
      else if (response.ok) existing += 1;
      else throw new Error(`${activity.id}: import failed with HTTP ${response.status}.`);
    }
    console.log(`Import complete: ${created} created, ${existing} already present.`);
  } else if (mode === "--rollback") {
    const response = await fetch(`${origin}/api/activities`);
    if (!response.ok) throw new Error(`History read failed with HTTP ${response.status}.`);
    const history = (await response.json()).activities as Array<{ id: string; updatedAt: string }>;
    const imported = new Set(activities.map((activity) => activity.id));
    let removed = 0;
    for (const activity of history.filter((item) => imported.has(item.id))) {
      const deletion = await fetch(`${origin}/api/activities/${activity.id}`, {
        method: "DELETE",
        headers: { origin, cookie, "if-match": activity.updatedAt },
      });
      if (!deletion.ok) throw new Error(`${activity.id}: rollback failed with HTTP ${deletion.status}.`);
      removed += 1;
    }
    console.log(`Rollback complete: ${removed} imported activities soft-deleted.`);
  } else {
    throw new Error("Use --dry-run, --apply, or --rollback.");
  }

  const verification = await fetch(`${origin}/api/activities`);
  if (!verification.ok) throw new Error(`Verification failed with HTTP ${verification.status}.`);
  const history = (await verification.json()).activities as Array<{ id: string }>;
  const expected = new Set(activities.map((activity) => activity.id));
  const present = history.filter((item) => expected.has(item.id)).length;
  console.log(`Verification: ${present}/${activities.length} imported activities are active; ${history.length} total active.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

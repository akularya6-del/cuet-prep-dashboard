import { Lock } from "lucide-react";
import { syllabus } from "@/lib/syllabus";
import { appliedMathematicsOutline } from "@/lib/source-details";

export function MethodContent({
  configured,
  owner,
  onUnlock,
}: {
  configured: boolean;
  owner: boolean;
  onUnlock: () => void;
}) {
  return (
    <section className="method-grid">
      <div className="method-main">
        <h2>What the percentages mean</h2>
        <p>
          These are preparation estimates, not predicted exam scores. All
          progress is rebuilt from your history, using India time. Nothing is
          marked complete until you record it.
        </p>
        <div className="formula-list">
          <article>
            <div>
              <h3>Coverage · have I studied it?</h3>
              <p>
                First study, revision or recall confirms prior learning and
                gives 100% topic coverage. Practice or testing alone gives 60%
                exposure. Other activity gives no coverage. Repeating first
                study never adds extra coverage.
              </p>
            </div>
          </article>
          <article>
            <div>
              <h3>Mastery · can I recall and use it?</h3>
              <p>
                Learning + recall + practice + testing, capped at 100. First
                study supplies 25 points; revision or recall without a
                first-study entry supplies 20; applied exposure alone supplies
                10.
              </p>
            </div>
          </article>
          <article>
            <div>
              <h3>Recall · up to 30 points</h3>
              <p>
                30 × (1 − exp(−0.7 × evidence)) × freshness. Each attempt adds
                evidence of (confidence − 1) ÷ 4, or 0.8 when confidence is
                omitted. Confidence 1 adds zero. Recall numbers are labels;
                actual saved attempts drive the count. Revisions refresh the
                study date but are not counted as retrieval practice.
              </p>
              <p>
                Intervals after recall attempts 1–5+ are 7, 21, 45, 90 and 150
                days. After the interval, freshness decreases by overdue days ÷
                360 to a floor of 0.65. Coverage never decays.
              </p>
            </div>
          </article>
          <article>
            <div>
              <h3>Practice · up to 20 points</h3>
              <p>
                20 × min(1, √(allocated questions ÷ 100)) × accuracy. Correct
                and attempted counts are allocated equally across selected
                topics. The subject total counts the original session once.
                Topic allocations can therefore be fractional; they are
                estimates, not claims of separately measured topic scores.
              </p>
            </div>
          </article>
          <article>
            <div>
              <h3>Tests · up to 25 points</h3>
              <p>
                Take the five most recent scored tests in chronological order,
                weighting them 1, 2, 3, 4, 5 from oldest to newest. Test points
                = 25 × weighted accuracy × min(1, 0.55 + 0.15 × (attempts − 1)).
                A section, subject or mock score is shared evidence for the
                topics you explicitly select.
              </p>
            </div>
          </article>
          <article>
            <div>
              <h3>Weighting and status</h3>
              <p>
                Each topic has a scope weight from 1–5 based on the amount of
                retained syllabus wording: ceil(words ÷ 14), capped at 5. Divide
                by the sum of scope weights within that subject. These are
                transparent workload estimates; the PDFs do not supply marks per
                topic. Each subject reaches exactly 100%. Overall preparation
                assigns 20% to each of the five subjects so a longer PDF cannot
                dominate.
              </p>
              <p>
                Strong begins at 70; Mastered begins at 85. Practice or test
                accuracy below 65% flags Weak. Overdue recall remains visible
                even when mastery is high. Internal precision is retained; only
                displayed percentages round to 0.1%.
              </p>
            </div>
          </article>
        </div>
        <h2>Official source decisions</h2>
        <p>
          Mathematics uses B1. A1 overlaps its algebra, calculus, integration,
          differential equations and linear programming topics, so those are not
          counted twice. Simple probability from A1 is included with
          Probability. The separate B2 Applied Mathematics pathway is retained
          below for reference, outside progress totals.
        </p>
        <p>
          English explicitly says its topic list is not exhaustive. GAT supplies
          broad topics rather than a chapter list; no unofficial chapters have
          been invented. PE repeats Handball and prints several unusual asana
          spellings. Duplicate Handball is counted once; listed asanas remain
          visible in the source wording.
        </p>
        <details className="reference-outline">
          <summary>Section B2 · Applied Mathematics reference</summary>
          {appliedMathematicsOutline.map((unit) => (
            <section key={unit.unit}>
              <h3>{unit.unit}</h3>
              <ul>
                {unit.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
              <a
                href={`/syllabus/202512271521179041.pdf#page=${unit.page}`}
                target="_blank"
                rel="noreferrer"
              >
                Original competencies · page {unit.page} ↗
              </a>
            </section>
          ))}
        </details>
      </div>
      <aside className="setup-panel">
        <span className={`setup-indicator ${configured ? "ready" : ""}`}>
          <i />
          {configured ? "Database connected" : "Finish setup to save progress"}
        </span>
        <h3>Owner editing</h3>
        <p>
          {owner
            ? "Editing is unlocked in this browser."
            : "Anyone with the URL can view activity, including notes. The owner password is needed to edit."}
        </p>
        {!owner && (
          <button onClick={onUnlock}>
            <Lock size={16} />
            Unlock editing
          </button>
        )}
        {!configured && (
          <>
            <hr />
            <h3>Free setup</h3>
            <ol>
              <li>
                Create a Free project at{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                >
                  Supabase
                </a>
                .
              </li>
              <li>
                In SQL Editor, run both migration files from the repository in
                filename order.
              </li>
              <li>
                Set SUPABASE_URL, SUPABASE_SECRET_KEY and OWNER_PASSWORD in your
                local environment or Vercel project settings.
              </li>
              <li>
                Use a unique password of at least 20 characters, then restart
                locally or redeploy.
              </li>
            </ol>
            <p>
              Do not put keys in chat or notes. The README contains exact
              instructions. Supabase Free may pause after inactivity; resume it
              in its dashboard.
            </p>
          </>
        )}
        <hr />
        <h3>Original PDFs</h3>
        {syllabus.map((subject) => (
          <div className="source-row" key={subject.id}>
            <a
              href={`/syllabus/${subject.sourceFile}`}
              target="_blank"
              rel="noreferrer"
            >
              {subject.name} · {subject.code} ↗
            </a>
            <small>{subject.topics.length} tracked topics</small>
          </div>
        ))}
      </aside>
    </section>
  );
}

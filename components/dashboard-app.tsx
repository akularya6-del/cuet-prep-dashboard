"use client";

import {
  Activity as ActivityIcon,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Gauge,
  History,
  Languages,
  Lightbulb,
  Lock,
  LogOut,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sigma,
  Sparkles,
  Target,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  dailySummary,
  overallProgress,
  progressTimeline,
  recommendTopics,
  subjectProgress,
  topicProgress,
} from "@/lib/progress";
import {
  allTopics,
  normalizedTopicWeight,
  syllabus,
  subjectById,
  topicById,
} from "@/lib/syllabus";
import { MethodContent } from "./method-content";
import { today as localDate } from "@/lib/dates";
import {
  ACTIVITY_TYPES,
  type Activity,
  type ActivityType,
  type SubjectId,
  type TopicProgress,
} from "@/lib/types";

type View =
  | "dashboard"
  | "subjects"
  | "log"
  | "history"
  | "analytics"
  | "recommendations"
  | "settings";
type FormState = Omit<Activity, "id" | "createdAt" | "updatedAt">;
const CACHE_KEY = "cuet-progress-cache-v1";
const TEST_TYPES: ActivityType[] = [
  "topic-test",
  "section-test",
  "subject-test",
  "mock-test",
];
const activityLabels: Record<ActivityType, string> = {
  "first-study": "First study",
  revision: "Revision",
  recall: "Recall",
  practice: "Practice questions",
  "topic-test": "Topic test",
  "section-test": "Section test",
  "subject-test": "Subject test",
  "mock-test": "Mock test",
  other: "Other",
};
const subjectIcons = {
  mathematics: Sigma,
  chemistry: FlaskConical,
  english: Languages,
  "physical-education": ActivityIcon,
  gat: Sparkles,
};
const emptyForm = (subjectId: SubjectId = "mathematics"): FormState => ({
  occurredOn: localDate(),
  type: "first-study",
  subjectId,
  topicIds: [],
  questionsAttempted: null,
  questionsCorrect: null,
  scorePercent: null,
  durationMinutes: null,
  confidence: null,
  recallNumber: null,
  notes: "",
});
const fmt = (value: number) => `${value.toFixed(1)}%`;
const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
const titleFor = (view: View) =>
  ({
    dashboard: "Preparation overview",
    subjects: "Official syllabus",
    log: "Log activity",
    history: "Study history",
    analytics: "Performance analytics",
    recommendations: "Recommended next",
    settings: "Method & settings",
  })[view];
const nav = [
  ["dashboard", Gauge, "Overview"],
  ["subjects", BookOpen, "Syllabus"],
  ["log", Plus, "Log activity"],
  ["history", History, "History"],
  ["analytics", BarChart3, "Analytics"],
  ["recommendations", Lightbulb, "Recommended"],
  ["settings", Settings, "Settings"],
] as const;

export default function DashboardApp() {
  const [view, updateView] = useState<View>("dashboard");
  const setView = (next: View) => {
    updateView(next);
    window.location.hash = next;
  };
  const [selectedSubject, setSelectedSubject] =
    useState<SubjectId>("mathematics");
  const cursor = useRef("");
  const fetching = useRef(false);
  const [historyTopic, setHistoryTopic] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const openSubject = (id: SubjectId) => {
    setSelectedSubject(id);
    setView("subjects");
  };
  const [activities, setActivities] = useState<Activity[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [owner, setOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cached, setCached] = useState(false);
  const [online, setOnline] = useState(true);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [prefill, setPrefill] = useState<Partial<FormState>>({});
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = async (quiet = false) => {
    if (fetching.current) return;
    fetching.current = true;
    if (!quiet) setLoading(true);
    try {
      const updates: Activity[] = [];
      const deleted = new Set<string>();
      let offset: number | null = 0;
      let nextCursor = cursor.current;
      let connected = false;
      do {
        const params = new URLSearchParams({ offset: String(offset) });
        if (cursor.current) params.set("since", cursor.current);
        const response = await fetch("/api/activities?" + params, {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error("load");
        const payload = await response.json();
        connected = Boolean(payload.configured);
        updates.push(...payload.activities);
        for (const id of payload.deletedIds ?? []) deleted.add(id);
        nextCursor = payload.cursor ?? "";
        offset = payload.nextOffset ?? null;
      } while (offset !== null);
      const initial = !cursor.current;
      setActivities((current) => {
        const merged = new Map(
          (initial ? [] : current).map((activity) => [activity.id, activity]),
        );
        for (const activity of updates) merged.set(activity.id, activity);
        for (const id of deleted) merged.delete(id);
        return [...merged.values()];
      });
      cursor.current = nextCursor;
      setConfigured(connected);
      setCached(false);
      setMessage("");
    } catch {
      setCached(true);
      setMessage(
        "Could not sync. Your last loaded progress is shown; check the connection and retry.",
      );
    } finally {
      fetching.current = false;
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    setOnline(navigator.onLine);
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "[]");
      if (
        Array.isArray(cached) &&
        cached.every(
          (a) =>
            a &&
            typeof a.id === "string" &&
            Array.isArray(a.topicIds) &&
            subjectById.has(a.subjectId),
        )
      )
        setActivities(cached);
    } catch {
      /* Unavailable cache does not prevent online use. */
    }
    const changeView = () => {
      const hash = window.location.hash.slice(1);
      if (nav.some(([id]) => id === hash)) updateView(hash as View);
    };
    changeView();
    window.addEventListener("hashchange", changeView);
    void load();
    void fetch("/api/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setOwner(Boolean(data.authenticated)))
      .catch(() => setOwner(false));
    const onlineHandler = () => {
      setOnline(true);
      void load(true);
    };
    const offlineHandler = () => setOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    const interval = window.setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible")
        void load(true);
    }, 30_000);
    return () => {
      window.removeEventListener("hashchange", changeView);
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(activities));
      } catch {
        /* Cache is optional. */
      }
    }
  }, [activities, loading]);
  const openLog = (
    subjectId?: SubjectId,
    topicId?: string,
    type?: ActivityType,
  ) => {
    setEditing(null);
    setPrefill({
      ...(subjectId ? { subjectId } : {}),
      ...(topicId ? { topicIds: [topicId] } : {}),
      ...(type ? { type } : {}),
    });
    setView("log");
    setMenuOpen(false);
  };
  const overall = useMemo(() => overallProgress(activities), [activities]);
  const recommendations = useMemo(
    () => recommendTopics(activities),
    [activities],
  );

  return (
    <main className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span>CU</span>
          <div>
            <strong>CUET</strong>
            <small>Preparation 2026</small>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          {nav.map(([id, Icon, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                setMenuOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className={`sync-state ${cached || !online ? "warning" : ""}`}>
            {cached || !online ? <WifiOff size={15} /> : <Check size={15} />}
            <span>
              {!online
                ? "Offline · read only"
                : cached
                  ? "Showing cached data"
                  : configured === false
                    ? "Setup required"
                    : configured === null
                      ? "Connecting…"
                      : "Synced"}
            </span>
          </div>
          <button
            className="owner-button"
            onClick={() =>
              owner
                ? void lockOwner(setOwner).catch(() =>
                    setMessage("Could not lock editing. Please retry."),
                  )
                : setUnlockOpen(true)
            }
          >
            {owner ? <LogOut size={16} /> : <Lock size={16} />}
            {owner ? "Lock editing" : "Owner access"}
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="scrim"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <section className="workspace">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <p>
              {new Intl.DateTimeFormat("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(new Date())}
            </p>
            <h1>{titleFor(view)}</h1>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              aria-label="Refresh progress"
              onClick={() => void load()}
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="primary-button"
              aria-label="Log activity"
              onClick={() => openLog()}
            >
              <Plus size={18} />
              <span>Log activity</span>
            </button>
          </div>
        </header>
        {message && (
          <div className="notice error" role="alert">
            <CircleAlert size={18} />
            <span>{message}</span>
            <button aria-label="Dismiss error" onClick={() => setMessage("")}>
              <X size={17} />
            </button>
          </div>
        )}
        {!online && (
          <div className="notice">
            <WifiOff size={18} />
            <span>
              You are offline. Cached progress remains available; reconnect to
              edit.
            </span>
          </div>
        )}
        {configured === false && (
          <div className="notice">
            <CircleAlert size={18} />
            <span>
              Database setup is not complete. The dashboard is read-only and
              starts at zero.
            </span>
            <button onClick={() => setView("settings")}>Setup</button>
          </div>
        )}
        {savedMessage && (
          <div className="notice success" role="status">
            <Check size={18} />
            <span>{savedMessage}</span>
            <button
              aria-label="Dismiss saved confirmation"
              onClick={() => setSavedMessage("")}
            >
              <X size={17} />
            </button>
          </div>
        )}
        <div id="main-content" className="view" aria-busy={loading}>
          {loading ? (
            <Loading />
          ) : view === "dashboard" ? (
            <Overview
              activities={activities}
              overall={overall}
              recommendations={recommendations}
              onView={setView}
              onLog={openLog}
              onSubject={openSubject}
            />
          ) : view === "subjects" ? (
            <Subjects
              activities={activities}
              onLog={openLog}
              subjectId={selectedSubject}
              setSubjectId={setSelectedSubject}
              onHistory={(id) => {
                setHistoryTopic(id);
                setView("history");
              }}
            />
          ) : view === "log" ? (
            <ActivityForm
              owner={owner}
              online={online}
              configured={Boolean(configured) && !cached}
              editing={editing}
              prefill={prefill}
              activities={activities}
              onUnlock={() => setUnlockOpen(true)}
              onSaved={(activity) => {
                setActivities((current) => [
                  activity,
                  ...current.filter((item) => item.id !== activity.id),
                ]);
                setSavedMessage(
                  editing
                    ? "Correction saved. Progress recalculated."
                    : "Activity saved. Progress updated.",
                );
                setEditing(null);
                setPrefill({});
                setView("history");
              }}
              onMessage={setMessage}
            />
          ) : view === "history" ? (
            <HistoryView
              activities={activities}
              owner={owner && online && !cached}
              topicFilter={historyTopic}
              clearTopic={() => setHistoryTopic("")}
              onEdit={(activity) => {
                setEditing(activity);
                setPrefill(activity);
                setView("log");
              }}
              onDelete={(id) =>
                void deleteActivity(
                  id,
                  activities.find((item) => item.id === id)!.updatedAt,
                  setActivities,
                  setMessage,
                )
              }
            />
          ) : view === "analytics" ? (
            <Analytics activities={activities} onView={setView} />
          ) : view === "recommendations" ? (
            <Recommendations
              items={recommendations}
              onLog={openLog}
              onView={setView}
            />
          ) : (
            <Method
              configured={Boolean(configured)}
              owner={owner}
              onUnlock={() => setUnlockOpen(true)}
              onView={setView}
            />
          )}
        </div>
      </section>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.slice(0, 4).map(([id, Icon, label]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => setView(id)}
          >
            <Icon size={20} />
            <span>{label === "Log activity" ? "Log" : label}</span>
          </button>
        ))}
        <button
          className={
            ["analytics", "recommendations", "settings"].includes(view)
              ? "active"
              : ""
          }
          onClick={() => setView("analytics")}
        >
          <BarChart3 size={20} />
          <span>Insights</span>
        </button>
      </nav>
      {unlockOpen && (
        <Unlock
          onClose={() => setUnlockOpen(false)}
          onSuccess={() => {
            setOwner(true);
            setUnlockOpen(false);
          }}
        />
      )}
    </main>
  );
}

function Loading() {
  return (
    <div className="loading-grid">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

function Overview({
  activities,
  overall,
  recommendations,
  onView,
  onLog,
  onSubject,
}: {
  activities: Activity[];
  onSubject: (id: SubjectId) => void;
  overall: ReturnType<typeof overallProgress>;
  recommendations: ReturnType<typeof recommendTopics>;
  onView: (view: View) => void;
  onLog: (subject?: SubjectId, topic?: string, type?: ActivityType) => void;
}) {
  const today = dailySummary(activities, localDate());
  const recent = [...activities]
    .sort(
      (a, b) =>
        b.occurredOn.localeCompare(a.occurredOn) ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 4);
  return (
    <>
      <section className="overview-band">
        <Metric
          label="Coverage"
          value={overall.coverage}
          note="Official syllabus studied"
          tone="coverage"
        />
        <Metric
          label="Mastery"
          value={overall.mastery}
          note="Recall, practice and tests"
          tone="mastery"
        />
        <div className="next-focus">
          <span>Recommended next</span>
          {recommendations[0] ? (
            <>
              <strong>
                {subjectById.get(recommendations[0].topic.subjectId)?.shortName}{" "}
                · {recommendations[0].topic.title}
              </strong>
              <p>{recommendations[0].reason}</p>
              <button
                onClick={() =>
                  onLog(
                    recommendations[0].topic.subjectId,
                    recommendations[0].topic.id,
                  )
                }
              >
                Log progress <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <strong>Everything is mastered.</strong>
              <p>Keep your recall rhythm steady.</p>
            </>
          )}
        </div>
      </section>
      <div className="section-heading">
        <div>
          <h2>Subjects</h2>
          <p>Coverage and mastery from your complete activity history.</p>
        </div>
        <button onClick={() => onView("subjects")}>
          Open syllabus <ChevronRight size={16} />
        </button>
      </div>
      <section className="subject-grid">
        {overall.subjects.map((stats) => (
          <SubjectCard
            key={stats.subjectId}
            stats={stats}
            onClick={() => onSubject(stats.subjectId)}
          />
        ))}
      </section>
      <section className="dashboard-lower">
        <div className="today-panel">
          <div className="panel-heading">
            <div>
              <h2>Today</h2>
              <p>{shortDate(localDate())}</p>
            </div>
            {today.studied + today.recalls + today.attempted === 0 && (
              <button onClick={() => onLog()}>Start logging</button>
            )}
          </div>
          <div className="today-stats">
            <MiniStat label="Topics studied" value={today.studied} />
            <MiniStat label="Recalls" value={today.recalls} />
            <MiniStat label="Questions" value={today.attempted} />
            <MiniStat
              label="Accuracy"
              value={today.accuracy === null ? "—" : fmt(today.accuracy)}
            />
          </div>
          <div className="gains">
            <span>Progress gained</span>
            <strong>
              {today.coverageGain >= 0 ? "+" : ""}
              {today.coverageGain.toFixed(1)}% coverage
            </strong>
            <strong>
              {today.masteryGain >= 0 ? "+" : ""}
              {today.masteryGain.toFixed(1)}% mastery
            </strong>
          </div>
        </div>
        <div className="recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>{recent.length ? "Newest first" : "Nothing logged yet"}</p>
            </div>
            {recent.length > 0 && (
              <button onClick={() => onView("history")}>View all</button>
            )}
          </div>
          {recent.length ? (
            <div className="compact-list">
              {recent.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} compact />
              ))}
            </div>
          ) : (
            <Empty
              icon={History}
              title="Your history starts here"
              text="Each study, recall, practice and test entry will appear chronologically."
            />
          )}
        </div>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  tone: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{fmt(value)}</strong>
      <div className="metric-track">
        <i style={{ width: `${value}%` }} />
      </div>
      <small>{note}</small>
    </div>
  );
}
function SubjectCard({
  stats,
  onClick,
}: {
  stats: ReturnType<typeof subjectProgress>;
  onClick: () => void;
}) {
  const subject = subjectById.get(stats.subjectId)!;
  const Icon = subjectIcons[stats.subjectId];
  return (
    <button
      className="subject-card"
      style={{ "--subject": subject.color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="subject-card-top">
        <span>
          <Icon size={18} />
        </span>
        <small>{subject.code}</small>
      </div>
      <h3>{subject.name}</h3>
      <div className="dual-progress">
        <div>
          <span>Coverage</span>
          <i>
            <b style={{ width: `${stats.coverage}%` }} />
          </i>
          <strong>{fmt(stats.coverage)}</strong>
        </div>
        <div>
          <span>Mastery</span>
          <i>
            <b style={{ width: `${stats.mastery}%` }} />
          </i>
          <strong>{fmt(stats.mastery)}</strong>
        </div>
      </div>
    </button>
  );
}
function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Subjects({
  activities,
  onLog,
  subjectId,
  setSubjectId,
  onHistory,
}: {
  subjectId: SubjectId;
  setSubjectId: (id: SubjectId) => void;
  onHistory: (id: string) => void;
  activities: Activity[];
  onLog: (subject: SubjectId, topic?: string, type?: ActivityType) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TopicProgress["status"] | "All">("All");
  const subject = subjectById.get(subjectId)!;
  const rows = (query ? allTopics : subject.topics)
    .map((topic) => ({ topic, progress: topicProgress(topic, activities) }))
    .filter(
      ({ topic, progress }) =>
        (filter === "All" || progress.status === filter) &&
        `${topic.title} ${topic.officialWording} ${topic.unit}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  const units = [...new Set(rows.map((row) => row.topic.unit))];
  const stats = subjectProgress(subjectId, activities);
  return (
    <>
      <div className="subject-tabs" aria-label="Subjects">
        {syllabus.map((item) => {
          const Icon = subjectIcons[item.id];
          return (
            <button
              aria-label={item.name}
              aria-pressed={subjectId === item.id}
              className={subjectId === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setSubjectId(item.id)}
            >
              <Icon size={17} />
              <span>{item.shortName}</span>
            </button>
          );
        })}
      </div>
      <section
        className="subject-hero"
        style={{ "--subject": subject.color } as React.CSSProperties}
      >
        <div>
          <span>CUET {subject.code}</span>
          <h2>{subject.name}</h2>
          <p>{subject.structureNote}</p>
          <a
            className="source-link"
            href={`/syllabus/${subject.sourceFile}`}
            target="_blank"
            rel="noreferrer"
          >
            Read official PDF ↗
          </a>
        </div>
        <div className="subject-hero-stats">
          <Metric
            label="Coverage"
            value={stats.coverage}
            note={`${stats.recalledTopics} recalled topics`}
            tone="coverage"
          />
          <Metric
            label="Mastery"
            value={stats.mastery}
            note={`${stats.questionsAttempted} practice questions`}
            tone="mastery"
          />
        </div>
      </section>
      <div className="syllabus-tools">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search all syllabus topics"
            placeholder="Search across all five subjects"
          />
        </label>
        <select
          aria-label="Filter by status"
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
        >
          {[
            "All",
            "Not started",
            "Covered",
            "Recall due",
            "Weak",
            "Strong",
            "Mastered",
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="unit-list">
        {units.length ? (
          units.map((unit, index) => (
            <details
              key={unit}
              open={index === 0 || Boolean(query) || filter !== "All"}
            >
              <summary>
                <span>{unit}</span>
                <small>
                  {rows.filter((row) => row.topic.unit === unit).length} topics
                </small>
                <ChevronRight size={18} />
              </summary>
              <div className="topic-list">
                {rows
                  .filter((row) => row.topic.unit === unit)
                  .map(({ topic, progress }) => (
                    <TopicRow
                      key={topic.id}
                      topic={topic}
                      progress={progress}
                      onLog={onLog}
                      onHistory={onHistory}
                    />
                  ))}
              </div>
            </details>
          ))
        ) : (
          <Empty
            icon={Search}
            title="No matching topics"
            text="Try a different search or status filter."
          />
        )}
      </div>
    </>
  );
}

function TopicRow({
  topic,
  progress,
  onLog,
  onHistory,
}: {
  onHistory: (id: string) => void;
  topic: (typeof allTopics)[number];
  progress: TopicProgress;
  onLog: (subject: SubjectId, topic?: string, type?: ActivityType) => void;
}) {
  return (
    <article className="topic-row">
      <div className="topic-copy">
        <span
          className={`status ${progress.status.toLowerCase().replaceAll(" ", "-")}`}
        >
          {progress.status}
        </span>
        <h3>{topic.title}</h3>
        <p>{topic.officialWording}</p>
        <small>
          <a
            href={`/syllabus/${topic.sourceFile}#page=${topic.sourcePage}`}
            target="_blank"
            rel="noreferrer"
          >
            Official PDF · page {topic.sourcePage}
          </a>{" "}
          · Weight {(normalizedTopicWeight(topic) * 100).toFixed(1)}%
        </small>
      </div>
      <div className="topic-metrics">
        <div>
          <span>Coverage</span>
          <strong>{fmt(progress.coverage)}</strong>
        </div>
        <div>
          <span>Mastery</span>
          <strong>{fmt(progress.mastery)}</strong>
        </div>
        <div>
          <span>Recall</span>
          <strong>{progress.recallCount}</strong>
        </div>
        <div>
          <span>Questions</span>
          <strong>{Number(progress.questionsAttempted.toFixed(1))}</strong>
        </div>
      </div>
      <div className="topic-evidence">
        <span>
          Practice: {progress.accuracy === null ? "—" : fmt(progress.accuracy)}
        </span>
        <span>
          Tests:{" "}
          {progress.testAverage === null ? "—" : fmt(progress.testAverage)} (
          {progress.testCount})
        </span>
        <span>Last studied: {progress.lastStudied ?? "—"}</span>
        <span>Last recall: {progress.lastRecalled ?? "—"}</span>
      </div>
      <div className="topic-actions">
        <button onClick={() => onLog(topic.subjectId, topic.id, "first-study")}>
          Study
        </button>
        <button onClick={() => onLog(topic.subjectId, topic.id, "recall")}>
          Recall
        </button>
        <button onClick={() => onLog(topic.subjectId, topic.id, "practice")}>
          Practice
        </button>
        <button onClick={() => onHistory(topic.id)}>History</button>
      </div>
    </article>
  );
}

function ActivityForm({
  owner,
  online,
  configured,
  editing,
  prefill,
  activities,
  onUnlock,
  onSaved,
  onMessage,
}: {
  owner: boolean;
  online: boolean;
  configured: boolean;
  editing: Activity | null;
  prefill: Partial<FormState>;
  activities: Activity[];
  onUnlock: () => void;
  onSaved: (activity: Activity) => void;
  onMessage: (message: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm(prefill.subjectId),
    ...prefill,
  }));
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const submissionId = useRef("");
  useEffect(() => {
    setForm({ ...emptyForm(prefill.subjectId), ...prefill });
    submissionId.current = editing?.id ?? crypto.randomUUID();
  }, [editing?.id, prefill]);
  const subject = subjectById.get(form.subjectId)!;
  const visibleTopics = subject.topics.filter((topic) =>
    `${topic.title} ${topic.unit} ${topic.officialWording}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const requiresQuestions = form.type === "practice";
  const requiresScore = TEST_TYPES.includes(form.type);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!owner) return onUnlock();
    if (!online || !configured)
      return onMessage(
        "Editing requires an internet connection and a configured database.",
      );
    setSaving(true);
    try {
      const response = await fetch(
        editing ? `/api/activities/${editing.id}` : "/api/activities",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "content-type": "application/json",
            ...(editing ? { "if-match": editing.updatedAt } : {}),
          },
          body: JSON.stringify({
            ...form,
            id: submissionId.current,
            recallNumber: form.type === "recall" ? form.recallNumber : null,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "The activity could not be saved.");
      onSaved(payload.activity as Activity);
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : "The activity could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  const recallsForSelection = activities.filter(
    (activity) =>
      activity.type === "recall" &&
      activity.topicIds.some((id) => form.topicIds.includes(id)),
  ).length;
  return (
    <form className="entry-layout" onSubmit={submit}>
      <section className="form-panel">
        <div className="form-heading">
          <div>
            <h2>{editing ? "Correct activity" : "What did you work on?"}</h2>
            <p>One fast, structured entry keeps every metric auditable.</p>
          </div>
          {editing && <span className="status started">Editing</span>}
        </div>
        <div className="field-grid">
          <label>
            <span>Activity type</span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm({
                  ...form,
                  type: event.target.value as ActivityType,
                  questionsAttempted: null,
                  questionsCorrect: null,
                  scorePercent: null,
                  confidence: null,
                  recallNumber: null,
                })
              }
            >
              {ACTIVITY_TYPES.map((type) => (
                <option value={type} key={type}>
                  {activityLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Date</span>
            <input
              type="date"
              required
              max={localDate()}
              value={form.occurredOn}
              onChange={(event) =>
                setForm({ ...form, occurredOn: event.target.value })
              }
            />
          </label>
          <label className="wide">
            <span>Subject</span>
            <select
              value={form.subjectId}
              onChange={(event) =>
                setForm({
                  ...form,
                  subjectId: event.target.value as SubjectId,
                  topicIds: [],
                })
              }
            >
              {syllabus.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="topic-picker">
          <div className="topic-picker-head">
            <label>
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${subject.shortName} topics`}
              />
            </label>
            <span>{form.topicIds.length} selected</span>
          </div>
          <div className="picker-actions">
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  topicIds: [
                    ...new Set([
                      ...form.topicIds,
                      ...visibleTopics.map((topic) => topic.id),
                    ]),
                  ],
                })
              }
            >
              Select all matching topics
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, topicIds: [] })}
            >
              Clear selection
            </button>
          </div>
          <div className="picker-list">
            {visibleTopics.map((topic) => {
              const selected = form.topicIds.includes(topic.id);
              return (
                <button
                  type="button"
                  key={topic.id}
                  aria-pressed={selected}
                  className={selected ? "selected" : ""}
                  onClick={() =>
                    setForm({
                      ...form,
                      topicIds: selected
                        ? form.topicIds.filter((id) => id !== topic.id)
                        : [...form.topicIds, topic.id],
                    })
                  }
                >
                  <i>{selected && <Check size={14} />}</i>
                  <span>
                    <strong>{topic.title}</strong>
                    <small>{topic.unit}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="form-explanation">
          Shared question counts are split equally across selected topics. A
          broad test score is shared evidence, not a separate test per topic.
          Confidence 1 records an unsuccessful recall.
        </p>
        <div className="field-grid optional">
          {requiresQuestions && (
            <>
              <label>
                <span>Questions attempted</span>
                <input
                  min="0"
                  type="number"
                  inputMode="numeric"
                  value={form.questionsAttempted ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      questionsAttempted:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                  required
                />
              </label>
              <label>
                <span>Questions correct</span>
                <input
                  min="0"
                  type="number"
                  inputMode="numeric"
                  value={form.questionsCorrect ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      questionsCorrect:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                  required
                />
              </label>
            </>
          )}
          {requiresScore && (
            <label>
              <span>Score (%)</span>
              <input
                min="0"
                max="100"
                step="0.1"
                type="number"
                inputMode="decimal"
                value={form.scorePercent ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    scorePercent:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
                required
              />
            </label>
          )}
          <label>
            <span>Time spent (minutes)</span>
            <input
              min="0"
              type="number"
              inputMode="numeric"
              value={form.durationMinutes ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  durationMinutes:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
          {(form.type === "recall" || form.type === "revision") && (
            <label>
              <span>Confidence</span>
              <select
                value={form.confidence ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    confidence: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
              >
                <option value="">Not set</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </select>
            </label>
          )}
          {form.type === "recall" && (
            <label>
              <span>Recall number</span>
              <input
                min="1"
                type="number"
                placeholder={`Suggested: ${recallsForSelection + 1}`}
                value={form.recallNumber ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    recallNumber:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
              />
            </label>
          )}
          <label className="wide">
            <span>Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              maxLength={4000}
              placeholder="Optional detail, mistakes, or follow-up"
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </label>
        </div>
        {!owner && (
          <div className="form-lock">
            <Lock size={18} />
            <span>Unlock owner access to save changes.</span>
            <button type="button" onClick={onUnlock}>
              Unlock
            </button>
          </div>
        )}
        <button
          className="submit-button"
          disabled={saving || !form.topicIds.length || !online || !configured}
        >
          {saving ? "Saving…" : editing ? "Save correction" : "Save activity"}
        </button>
      </section>
      <aside className="entry-aside">
        <h3>Selected syllabus</h3>
        {form.topicIds.length ? (
          form.topicIds.map((id) => (
            <div key={id}>
              <span>{topicById.get(id)?.unit}</span>
              <strong>{topicById.get(id)?.title}</strong>
              <button
                type="button"
                aria-label="Remove topic"
                onClick={() =>
                  setForm({
                    ...form,
                    topicIds: form.topicIds.filter((topicId) => topicId !== id),
                  })
                }
              >
                <X size={15} />
              </button>
            </div>
          ))
        ) : (
          <p>
            Choose one or more official topics. Search works across titles and
            source wording.
          </p>
        )}
      </aside>
    </form>
  );
}

function HistoryView({
  activities,
  owner,
  onEdit,
  onDelete,
  topicFilter,
  clearTopic,
}: {
  topicFilter: string;
  clearTopic: () => void;
  activities: Activity[];
  owner: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}) {
  const [subject, setSubject] = useState<SubjectId | "all">("all");
  const [type, setType] = useState<ActivityType | "all">("all");
  const [date, setDate] = useState("");
  const filtered = [...activities]
    .filter(
      (activity) =>
        (!topicFilter || activity.topicIds.includes(topicFilter)) &&
        (subject === "all" || activity.subjectId === subject) &&
        (type === "all" || activity.type === type) &&
        (!date || activity.occurredOn === date),
    )
    .sort(
      (a, b) =>
        b.occurredOn.localeCompare(a.occurredOn) ||
        b.createdAt.localeCompare(a.createdAt),
    );
  const dates = [...new Set(filtered.map((activity) => activity.occurredOn))];
  return (
    <>
      {topicFilter && (
        <div className="notice">
          <span>History for {topicById.get(topicFilter)?.title}</span>
          <button onClick={clearTopic}>Show all topics</button>
        </div>
      )}
      <div className="history-tools">
        <select
          aria-label="Filter subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value as typeof subject)}
        >
          <option value="all">All subjects</option>
          {syllabus.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter activity"
          value={type}
          onChange={(event) => setType(event.target.value as typeof type)}
        >
          <option value="all">All activities</option>
          {ACTIVITY_TYPES.map((item) => (
            <option key={item} value={item}>
              {activityLabels[item]}
            </option>
          ))}
        </select>
        <input
          aria-label="Filter date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        {date && <button onClick={() => setDate("")}>Clear</button>}
      </div>
      {dates.length ? (
        <div className="timeline">
          {dates.map((item) => (
            <section key={item}>
              <header>
                <h2>{item === localDate() ? "Today" : shortDate(item)}</h2>
                <span>
                  {
                    filtered.filter((activity) => activity.occurredOn === item)
                      .length
                  }{" "}
                  activities
                </span>
              </header>
              <div>
                {filtered
                  .filter((activity) => activity.occurredOn === item)
                  .map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      owner={owner}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Empty
          icon={History}
          title="No activity found"
          text={
            activities.length
              ? "Adjust the filters to see more history."
              : "Log your first study session to begin the timeline."
          }
        />
      )}
    </>
  );
}

function ActivityRow({
  activity,
  compact = false,
  owner = false,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  compact?: boolean;
  owner?: boolean;
  onEdit?: (activity: Activity) => void;
  onDelete?: (id: string) => void;
}) {
  const subject = subjectById.get(activity.subjectId)!;
  const Icon = subjectIcons[activity.subjectId];
  const names = activity.topicIds
    .map((id) => topicById.get(id)?.title)
    .filter(Boolean)
    .join(", ");
  const detail =
    activity.type === "practice"
      ? `${activity.questionsCorrect ?? 0}/${activity.questionsAttempted ?? 0} correct`
      : TEST_TYPES.includes(activity.type)
        ? `${activity.scorePercent?.toFixed(1) ?? "—"}%`
        : activity.type === "recall" && activity.recallNumber
          ? `Recall #${activity.recallNumber}`
          : activity.durationMinutes
            ? `${activity.durationMinutes} min`
            : "";
  return (
    <article
      className={`activity-row ${compact ? "compact" : ""}`}
      style={{ "--subject": subject.color } as React.CSSProperties}
    >
      <span className="activity-icon">
        <Icon size={17} />
      </span>
      <div>
        <small>
          {subject.shortName} · {activityLabels[activity.type]}
        </small>
        <strong>{names}</strong>
        {!compact && (
          <details className="activity-detail">
            <summary>Activity details</summary>
            <p>
              {activity.topicIds
                .map((id) => topicById.get(id)?.title)
                .join(", ")}
            </p>
            <p>
              Date: {shortDate(activity.occurredOn)} · Time:{" "}
              {activity.durationMinutes ?? "—"} min · Confidence:{" "}
              {activity.confidence ?? "—"}/5 · Recall label:{" "}
              {activity.recallNumber ?? "automatic count"}
            </p>
            {activity.questionsAttempted !== null && (
              <p>
                Attempted: {activity.questionsAttempted} · Correct:{" "}
                {activity.questionsCorrect ?? "—"} · Incorrect:{" "}
                {activity.questionsCorrect === null
                  ? "—"
                  : activity.questionsAttempted - activity.questionsCorrect}
              </p>
            )}
            {activity.notes && <p>{activity.notes}</p>}
          </details>
        )}
      </div>
      {detail && <b>{detail}</b>}
      {!compact && owner && (
        <div className="row-actions">
          <button aria-label="Edit activity" onClick={() => onEdit?.(activity)}>
            <Pencil size={16} />
          </button>
          <button
            aria-label="Delete activity"
            onClick={() => {
              if (
                confirm(
                  "Delete this activity? All derived progress will be recalculated.",
                )
              )
                onDelete?.(activity.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </article>
  );
}

function Analytics({
  activities,
  onView,
}: {
  activities: Activity[];
  onView: (view: View) => void;
}) {
  const [testSubject, setTestSubject] = useState<SubjectId>("mathematics");
  const tests = activities
    .filter((a) => a.subjectId === testSubject && TEST_TYPES.includes(a.type))
    .sort(
      (a, b) =>
        a.occurredOn.localeCompare(b.occurredOn) ||
        a.createdAt.localeCompare(b.createdAt),
    );
  const studyDays = [...new Set(activities.map((a) => a.occurredOn))]
    .sort()
    .slice(-10)
    .map((date) => ({
      date,
      value: activities.filter((a) => a.occurredOn === date).length,
    }));
  const overall = overallProgress(activities);
  const timeline = progressTimeline(activities);
  const recallBuckets = [0, 1, 2, 3].map((count) => ({
    label:
      count === 3 ? "3+ recalls" : `${count} recall${count === 1 ? "" : "s"}`,
    value: allTopics.filter((topic) => {
      const recalls = topicProgress(topic, activities).recallCount;
      return count === 3 ? recalls >= 3 : recalls === count;
    }).length,
  }));
  const practices = activities
    .filter((activity) => activity.type === "practice")
    .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));
  const groupedQuestions = [
    ...new Set(practices.map((activity) => activity.occurredOn)),
  ]
    .slice(-10)
    .map((date) => ({
      date,
      value: practices
        .filter((activity) => activity.occurredOn === date)
        .reduce((sum, activity) => sum + (activity.questionsAttempted ?? 0), 0),
    }));
  return (
    <>
      <InsightTabs active="analytics" onView={onView} />
      <section className="analytics-grid">
        <div className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Test progression</h2>
              <p>Historical attempts, never overwritten</p>
            </div>
            <select
              aria-label="Test chart subject"
              value={testSubject}
              onChange={(event) =>
                setTestSubject(event.target.value as SubjectId)
              }
            >
              {syllabus.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.shortName}
                </option>
              ))}
            </select>
          </div>
          {tests.length ? (
            <>
              <LineChart
                single
                points={tests.map((test) => ({
                  label: test.occurredOn,
                  a:
                    test.scorePercent ??
                    ((test.questionsCorrect ?? 0) /
                      (test.questionsAttempted || 1)) *
                      100,
                }))}
              />
              <details>
                <summary>All test results ({tests.length})</summary>
                {tests.map((test) => (
                  <p key={test.id}>
                    {shortDate(test.occurredOn)} · {activityLabels[test.type]} ·{" "}
                    {test.scorePercent ??
                      (
                        ((test.questionsCorrect ?? 0) /
                          (test.questionsAttempted || 1)) *
                        100
                      ).toFixed(1)}
                    %
                  </p>
                ))}
              </details>
            </>
          ) : (
            <ChartEmpty />
          )}
        </div>
        <div className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Study activity</h2>
              <p>Entries on your last ten active days</p>
            </div>
          </div>
          {studyDays.length ? (
            <BarChart values={studyDays} unit="activities" />
          ) : (
            <ChartEmpty />
          )}
        </div>
        <div className="chart-panel wide">
          <div className="panel-heading">
            <div>
              <h2>Subject comparison</h2>
              <p>Coverage against evidence-backed mastery</p>
            </div>
          </div>
          <div className="comparison-chart">
            {overall.subjects.map((stats) => (
              <div key={stats.subjectId}>
                <span>{subjectById.get(stats.subjectId)?.shortName}</span>
                <div>
                  <i
                    style={{
                      width: `${stats.coverage}%`,
                      background: "var(--accent)",
                    }}
                  />
                  <i
                    style={{
                      width: `${stats.mastery}%`,
                      background: "var(--mastery)",
                    }}
                  />
                </div>
                <b>
                  {fmt(stats.coverage)} / {fmt(stats.mastery)}
                </b>
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <i className="coverage-dot" />
              Coverage
            </span>
            <span>
              <i className="mastery-dot" />
              Mastery
            </span>
          </div>
        </div>
        <div className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Progress over time</h2>
              <p>History-derived, after every active day</p>
            </div>
          </div>
          {timeline.length ? (
            <LineChart
              points={timeline.map((item) => ({
                label: item.date,
                a: item.coverage,
                b: item.mastery,
              }))}
            />
          ) : (
            <ChartEmpty />
          )}
        </div>
        <div className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Questions solved</h2>
              <p>Last ten practice days</p>
            </div>
          </div>
          {groupedQuestions.length ? (
            <BarChart values={groupedQuestions} />
          ) : (
            <ChartEmpty />
          )}
        </div>
        <div className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Recall status</h2>
              <p>Across {allTopics.length} official topics</p>
            </div>
          </div>
          <div className="bucket-chart">
            {recallBuckets.map((bucket) => (
              <div key={bucket.label}>
                <span>{bucket.label}</span>
                <i>
                  <b
                    style={{
                      width: `${(bucket.value / allTopics.length) * 100}%`,
                    }}
                  />
                </i>
                <strong>{bucket.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Practice accuracy</h2>
              <p>Each recorded practice session</p>
            </div>
          </div>
          {practices.some((item) => item.questionsAttempted) ? (
            <LineChart
              points={practices
                .filter((item) => item.questionsAttempted)
                .slice(-12)
                .map((item) => ({
                  label: item.occurredOn,
                  a:
                    ((item.questionsCorrect ?? 0) /
                      (item.questionsAttempted ?? 1)) *
                    100,
                }))}
              single
            />
          ) : (
            <ChartEmpty />
          )}
        </div>
      </section>
    </>
  );
}

function LineChart({
  points,
  single = false,
}: {
  points: { label: string; a: number; b?: number }[];
  single?: boolean;
}) {
  const coords = (key: "a" | "b") =>
    points
      .map(
        (point, index) =>
          `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${100 - (point[key] ?? 0)}`,
      )
      .join(" ");
  return (
    <div className="line-chart">
      <div className="chart-scale">
        <span>100</span>
        <span>50</span>
        <span>0</span>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Progress trend"
      >
        <path d="M0 25H100M0 50H100M0 75H100" className="grid-lines" />
        <polyline points={coords("a")} className="line-a" />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={points.length === 1 ? 50 : (index / (points.length - 1)) * 100}
            cy={100 - point.a}
            r="1.1"
            fill="var(--accent)"
          >
            <title>
              {point.label}: {fmt(point.a)}
            </title>
          </circle>
        ))}
        {!single && (
          <>
            <polyline points={coords("b")} className="line-b" />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={
                  points.length === 1 ? 50 : (index / (points.length - 1)) * 100
                }
                cy={100 - (point.b ?? 0)}
                r="1.1"
                fill="var(--mastery)"
              >
                <title>
                  {point.label}: {fmt(point.b ?? 0)}
                </title>
              </circle>
            ))}
          </>
        )}
      </svg>
      <div className="chart-dates">
        <span>{points[0]?.label.slice(5)}</span>
        <span>{points.at(-1)?.label.slice(5)}</span>
      </div>
    </div>
  );
}
function BarChart({
  values,
  unit = "questions",
}: {
  values: { date: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(...values.map((item) => item.value), 1);
  return (
    <div className="bar-chart">
      {values.map((item) => (
        <div key={item.date}>
          <b
            style={{ height: `${(item.value / max) * 100}%` }}
            title={`${item.value} ${unit}`}
          />
          <span>{item.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
function ChartEmpty() {
  return (
    <div className="chart-empty">
      <BarChart3 size={22} />
      <span>Chart appears after you log relevant activity.</span>
    </div>
  );
}

function Recommendations({
  items,
  onLog,
  onView,
}: {
  items: ReturnType<typeof recommendTopics>;
  onLog: (subject: SubjectId, topic?: string, type?: ActivityType) => void;
  onView: (view: View) => void;
}) {
  return (
    <>
      <InsightTabs active="recommendations" onView={onView} />
      <div className="recommendation-intro">
        <Target size={24} />
        <div>
          <h2>A deterministic study queue</h2>
          <p>
            Weak performance and overdue recall come first, followed by
            important uncovered topics in official order. Every item explains
            why it was selected.
          </p>
        </div>
      </div>
      <div className="recommendation-list">
        {items.map((item, index) => {
          const subject = subjectById.get(item.topic.subjectId)!;
          return (
            <article
              key={item.topic.id}
              style={{ "--subject": subject.color } as React.CSSProperties}
            >
              <span>{index + 1}</span>
              <div>
                <small>
                  {subject.name} · {item.topic.unit}
                </small>
                <h3>{item.topic.title}</h3>
                <p>{item.reason}</p>
              </div>
              <div>
                <strong>{fmt(item.progress.mastery)}</strong>
                <small>mastery</small>
                <button
                  onClick={() =>
                    onLog(
                      item.topic.subjectId,
                      item.topic.id,
                      item.progress.coverage ? "recall" : "first-study",
                    )
                  }
                >
                  Log progress
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Method({
  configured,
  owner,
  onUnlock,
  onView,
}: {
  configured: boolean;
  owner: boolean;
  onUnlock: () => void;
  onView: (view: View) => void;
}) {
  return (
    <>
      <InsightTabs active="settings" onView={onView} />
      <MethodContent
        configured={configured}
        owner={owner}
        onUnlock={onUnlock}
      />
    </>
  );
}

function InsightTabs({
  active,
  onView,
}: {
  active: "analytics" | "recommendations" | "settings";
  onView: (view: View) => void;
}) {
  return (
    <div className="insight-tabs">
      {[
        ["analytics", "Analytics"],
        ["recommendations", "Recommended"],
        ["settings", "Method"],
      ].map(([id, label]) => (
        <button
          key={id}
          className={active === id ? "active" : ""}
          onClick={() => onView(id as View)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Unlock({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onSuccess();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not unlock editing.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="unlock-dialog"
      aria-labelledby="unlock-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button className="dialog-close" aria-label="Close" onClick={onClose}>
        <X size={18} />
      </button>
      <span className="dialog-icon">
        <Lock size={20} />
      </span>
      <h2 id="unlock-title">Owner access</h2>
      <p>
        The password is verified only by the server and becomes a secure session
        cookie.
      </p>
      <form onSubmit={submit}>
        <label>
          <span>Owner password</span>
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <small className="form-error">{error}</small>}
        <button disabled={busy || !password}>
          {busy ? "Checking…" : "Unlock editing"}
        </button>
      </form>
    </dialog>
  );
}

function Empty({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof History;
  title: string;
  text: string;
}) {
  return (
    <div className="empty">
      <Icon size={25} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
async function lockOwner(setOwner: (value: boolean) => void) {
  const response = await fetch("/api/session", { method: "DELETE" });
  if (!response.ok) throw new Error("Could not lock editing.");
  setOwner(false);
}
async function deleteActivity(
  id: string,
  revision: string,
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>,
  setMessage: (message: string) => void,
) {
  try {
    const response = await fetch(`/api/activities/${id}`, {
      method: "DELETE",
      headers: { "if-match": revision },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error);
    setActivities((current) =>
      current.filter((activity) => activity.id !== id),
    );
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "The activity could not be deleted.",
    );
  }
}

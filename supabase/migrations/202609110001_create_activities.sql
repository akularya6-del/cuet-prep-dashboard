create extension if not exists pgcrypto;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  type text not null check (type in ('first-study', 'revision', 'recall', 'practice', 'topic-test', 'section-test', 'subject-test', 'mock-test', 'other')),
  subject_id text not null check (subject_id in ('mathematics', 'chemistry', 'english', 'physical-education', 'gat')),
  topic_ids text[] not null check (cardinality(topic_ids) > 0),
  questions_attempted integer check (questions_attempted is null or questions_attempted >= 0),
  questions_correct integer check (questions_correct is null or questions_correct >= 0),
  score_percent numeric(5,2) check (score_percent is null or score_percent between 0 and 100),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  confidence smallint check (confidence is null or confidence between 1 and 5),
  recall_number integer check (recall_number is null or recall_number >= 1),
  notes text not null default '' check (length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (questions_attempted is null or questions_correct is null or questions_correct <= questions_attempted)
);

create index if not exists activities_occurred_on_idx on public.activities (occurred_on desc);
create index if not exists activities_subject_id_idx on public.activities (subject_id);
create index if not exists activities_type_idx on public.activities (type);
create index if not exists activities_topic_ids_idx on public.activities using gin (topic_ids);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();

alter table public.activities enable row level security;

-- No client policies are intentional: only the server-side service role can read or write.

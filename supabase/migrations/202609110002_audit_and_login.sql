-- One personal owner; the database enforces a shared limit across server instances.
create table public.owner_login_limit (
  id boolean primary key default true check (id),
  window_started timestamptz not null,
  attempts integer not null
);
alter table public.owner_login_limit enable row level security;

create function public.allow_owner_login() returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  insert into public.owner_login_limit (id, window_started, attempts)
  values (true, now(), 1)
  on conflict (id) do update set
    attempts = case when public.owner_login_limit.window_started < now() - interval '15 minutes' then 1 else public.owner_login_limit.attempts + 1 end,
    window_started = case when public.owner_login_limit.window_started < now() - interval '15 minutes' then now() else public.owner_login_limit.window_started end
  returning attempts into used;
  return used <= 10;
end;
$$;
revoke all on function public.allow_owner_login() from public, anon, authenticated;
grant execute on function public.allow_owner_login() to service_role;

alter table public.activities add column deleted_at timestamptz;
create index activities_updated_idx on public.activities (updated_at, id);

-- Keep the prior value of every correction; deletes are recoverable soft deletes.
create table public.activity_revisions (
  id bigint generated always as identity primary key,
  activity_id uuid not null,
  previous_record jsonb not null,
  recorded_at timestamptz not null default now()
);
alter table public.activity_revisions enable row level security;
create function public.record_activity_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.activity_revisions(activity_id, previous_record) values (old.id, to_jsonb(old));
  return new;
end;
$$;
create trigger activities_record_revision before update on public.activities
for each row execute function public.record_activity_revision();
revoke all on public.activities, public.activity_revisions, public.owner_login_limit from anon, authenticated;

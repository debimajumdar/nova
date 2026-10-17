-- NOVA + PULSE schema (hackathon prototype)
-- Synthetic data only. Do not store real patient information in this database.

create extension if not exists "pgcrypto";

-- Patients (synthetic). family_token is the link a family opens; demo-grade, not real auth.
create table patients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  age int not null,
  guardian_name text not null,
  preferred_language text not null default 'en',
  reading_level text not null default 'standard' check (reading_level in ('simple', 'standard', 'detailed')),
  accessibility_needs text[] not null default '{}',
  procedure text not null,
  scheduled_at timestamptz not null,
  family_token text not null unique,
  created_at timestamptz not null default now()
);

-- A pathway is a structured prep journey for one procedure, e.g. "MRI Ready".
create table pathways (
  id text primary key,
  title text not null,
  description text not null
);

create table pathway_steps (
  pathway_id text not null references pathways(id) on delete cascade,
  key text not null,
  title text not null,
  audience text not null check (audience in ('child', 'parent')),
  kind text not null check (kind in ('learn', 'practice', 'task')),
  weight int not null check (weight > 0),
  sort int not null,
  primary key (pathway_id, key)
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  pathway_id text not null references pathways(id),
  assigned_by text not null,
  assigned_at timestamptz not null default now(),
  unique (patient_id, pathway_id)
);

create table step_progress (
  assignment_id uuid not null references assignments(id) on delete cascade,
  pathway_id text not null,
  step_key text not null,
  completed_at timestamptz not null default now(),
  primary key (assignment_id, step_key),
  foreign key (pathway_id, step_key) references pathway_steps(pathway_id, key)
);

-- Barriers are anything that could stop the visit from happening: language, transport, cost, anxiety.
create table barriers (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  kind text not null check (kind in ('interpreter', 'transportation', 'cost', 'anxiety', 'scheduling', 'other')),
  note text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  reported_via text not null default 'app' check (reported_via in ('app', 'sms', 'care_team')),
  created_at timestamptz not null default now()
);

-- Readiness is deterministic: weighted share of completed pathway steps. No AI involved.
create view patient_readiness as
select
  a.id as assignment_id,
  a.patient_id,
  a.pathway_id,
  coalesce(sum(s.weight) filter (where sp.step_key is not null), 0)::int as completed_weight,
  sum(s.weight)::int as total_weight,
  round(100.0 * coalesce(sum(s.weight) filter (where sp.step_key is not null), 0) / sum(s.weight))::int as readiness_pct
from assignments a
join pathway_steps s on s.pathway_id = a.pathway_id
left join step_progress sp on sp.assignment_id = a.id and sp.step_key = s.key
group by a.id, a.patient_id, a.pathway_id;

-- Demo-only access: the anon key can read/write these synthetic tables.
-- Replace with real auth + per-role policies before any real data is involved.
alter table patients enable row level security;
alter table pathways enable row level security;
alter table pathway_steps enable row level security;
alter table assignments enable row level security;
alter table step_progress enable row level security;
alter table barriers enable row level security;

create policy "demo all" on patients for all to anon using (true) with check (true);
create policy "demo all" on pathways for all to anon using (true) with check (true);
create policy "demo all" on pathway_steps for all to anon using (true) with check (true);
create policy "demo all" on assignments for all to anon using (true) with check (true);
create policy "demo all" on step_progress for all to anon using (true) with check (true);
create policy "demo all" on barriers for all to anon using (true) with check (true);

-- Explicit grants so this works even if "automatically expose new tables" is off.
grant usage on schema public to anon;
grant select, insert, update, delete on patients, pathways, pathway_steps, assignments, step_progress, barriers to anon;
grant select on patient_readiness to anon;

-- Live updates between the family view and the care team dashboard.
alter publication supabase_realtime add table assignments, step_progress, barriers;

-- AI rewrite review + audit log.
-- Addresses VEYZL findings: human oversight before AI health content reaches families (EU AI Act transparency
-- & human oversight, deployment approval workflow) and traceability of every generation (signed audit evidence).

create table ai_rewrites (
  id uuid primary key default gen_random_uuid(),
  step_key text not null,
  reading_level text not null,
  language text not null,
  -- Hash of the approved source text at generation time. If the source changes, old approvals no longer match.
  source_hash text not null,
  model text not null,
  paragraphs jsonb,
  omitted_or_uncertain jsonb not null default '[]',
  guardrail_failures jsonb not null default '[]',
  status text not null check (status in ('pending', 'approved', 'rejected', 'blocked')),
  requested_by_patient uuid references patients(id) on delete set null,
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create index ai_rewrites_lookup on ai_rewrites (step_key, reading_level, language, source_hash, status);

-- Browsers may READ (families see approved text, PULSE sees the queue) but never write.
-- Inserts and approvals go through server routes using the secret key, so a family can't forge an approval.
alter table ai_rewrites enable row level security;
create policy "demo read" on ai_rewrites for select to anon using (true);
grant select on ai_rewrites to anon;

alter publication supabase_realtime add table ai_rewrites;

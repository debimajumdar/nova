-- Synthetic demo data. Every person here is fictional.

insert into pathways (id, title, description) values
  ('mri-ready', 'MRI Ready', 'Helps a child and family prepare for an MRI scan: what it is, what it sounds like, how to stay still, and what to do beforehand.');

insert into pathway_steps (pathway_id, key, title, audience, kind, weight, sort) values
  ('mri-ready', 'meet-scanner',      'Meet the MRI scanner',          'child',  'learn',    15, 1),
  ('mri-ready', 'sound-practice',    'Practice the MRI sounds',       'child',  'practice', 20, 2),
  ('mri-ready', 'stillness-practice','Practice staying still',        'child',  'practice', 15, 3),
  ('mri-ready', 'understand-mri',    'Understand the MRI',            'parent', 'learn',    15, 4),
  ('mri-ready', 'safety-screening',  'Complete the metal safety check','parent', 'task',     15, 5),
  ('mri-ready', 'prep-instructions', 'Review food and arrival instructions', 'parent', 'task', 10, 6),
  ('mri-ready', 'confirm-visit',     'Confirm the appointment',       'parent', 'task',     10, 7);

insert into patients (display_name, age, guardian_name, preferred_language, reading_level, accessibility_needs, procedure, scheduled_at, family_token) values
  ('Maya R.',  6,  'Elena R.',  'en', 'simple',   '{}',                         'Brain MRI',       now() + interval '3 days',  'maya-demo'),
  ('Leo M.',   9,  'Rosa M.',   'es', 'simple',   '{interpreter}',              'Spine MRI',       now() + interval '2 days',  'leo-demo'),
  ('Aanya P.', 12, 'Priya P.',  'en', 'standard', '{}',                         'Knee MRI',        now() + interval '5 days',  'aanya-demo'),
  ('Sam T.',   7,  'Jordan T.', 'en', 'simple',   '{sensory_sensitivity}',      'Brain MRI',       now() + interval '1 day',   'sam-demo'),
  ('Noah K.',  14, 'Mina K.',   'en', 'detailed', '{low_vision}',               'Abdominal MRI',   now() + interval '6 days',  'noah-demo');

-- Maya is left unassigned so the demo can assign her pathway live.
insert into assignments (patient_id, pathway_id, assigned_by)
select id, 'mri-ready', 'Dr. Demo' from patients where family_token in ('leo-demo', 'aanya-demo', 'sam-demo', 'noah-demo');

insert into step_progress (assignment_id, pathway_id, step_key)
select a.id, 'mri-ready', k.step_key
from assignments a
join patients p on p.id = a.patient_id
join (values
  ('leo-demo',   'meet-scanner'),
  ('aanya-demo', 'meet-scanner'), ('aanya-demo', 'sound-practice'), ('aanya-demo', 'stillness-practice'),
  ('aanya-demo', 'understand-mri'), ('aanya-demo', 'safety-screening'), ('aanya-demo', 'prep-instructions'),
  ('aanya-demo', 'confirm-visit'),
  ('noah-demo',  'meet-scanner'), ('noah-demo', 'understand-mri'), ('noah-demo', 'safety-screening')
) as k(token, step_key) on k.token = p.family_token;

insert into barriers (patient_id, kind, note, reported_via)
select id, 'interpreter', 'Guardian prefers Spanish for all instructions', 'care_team' from patients where family_token = 'leo-demo'
union all
select id, 'transportation', 'No car available on scan day', 'app' from patients where family_token = 'leo-demo'
union all
select id, 'anxiety', 'Previous MRI attempt stopped early; child very worried about noise', 'care_team' from patients where family_token = 'sam-demo';

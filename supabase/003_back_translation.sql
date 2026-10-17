-- Literal English back-translation of each non-English AI draft, so reviewers who don't read the target
-- language can still check that the meaning matches the approved source.
alter table ai_rewrites add column back_translation jsonb;

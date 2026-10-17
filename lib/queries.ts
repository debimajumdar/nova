import { supabase } from "./supabase";
import type { Assignment, Barrier, PathwayStep, Patient, Readiness, StepProgress } from "./types";

export const PATHWAY_ID = "mri-ready";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function loadCareBoard() {
  const [patients, assignments, readiness, barriers, progress, steps] = await Promise.all([
    supabase.from("patients").select("*").order("scheduled_at").then(unwrap<Patient[]>),
    supabase.from("assignments").select("*").then(unwrap<Assignment[]>),
    supabase.from("patient_readiness").select("*").then(unwrap<Readiness[]>),
    supabase.from("barriers").select("*").eq("status", "open").order("created_at").then(unwrap<Barrier[]>),
    supabase.from("step_progress").select("*").then(unwrap<StepProgress[]>),
    loadSteps(),
  ]);
  return { patients, assignments, readiness, barriers, progress, steps };
}

export async function loadFamily(token: string) {
  const patient = await supabase
    .from("patients")
    .select("*")
    .eq("family_token", token)
    .maybeSingle()
    .then(unwrap<Patient | null>);
  if (!patient) return null;

  const [assignment, barriers, steps] = await Promise.all([
    supabase
      .from("assignments")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("pathway_id", PATHWAY_ID)
      .maybeSingle()
      .then(unwrap<Assignment | null>),
    supabase.from("barriers").select("*").eq("patient_id", patient.id).eq("status", "open").then(unwrap<Barrier[]>),
    loadSteps(),
  ]);

  const progress = assignment
    ? await supabase.from("step_progress").select("*").eq("assignment_id", assignment.id).then(unwrap<StepProgress[]>)
    : [];

  return { patient, assignment, barriers, steps, progress };
}

function loadSteps() {
  return supabase.from("pathway_steps").select("*").eq("pathway_id", PATHWAY_ID).order("sort").then(unwrap<PathwayStep[]>);
}

export function pctFromProgress(steps: PathwayStep[], done: Set<string>): number {
  const total = steps.reduce((s, x) => s + x.weight, 0);
  const completed = steps.filter((x) => done.has(x.key)).reduce((s, x) => s + x.weight, 0);
  return total ? Math.round((100 * completed) / total) : 0;
}

export async function assignPathway(patientId: string) {
  unwrap(await supabase.from("assignments").insert({ patient_id: patientId, pathway_id: PATHWAY_ID, assigned_by: "Care coordinator (demo)" }));
}

export async function setStepDone(assignmentId: string, stepKey: string, done: boolean) {
  if (done) {
    unwrap(
      await supabase
        .from("step_progress")
        .upsert({ assignment_id: assignmentId, pathway_id: PATHWAY_ID, step_key: stepKey }, { ignoreDuplicates: true }),
    );
  } else {
    unwrap(await supabase.from("step_progress").delete().eq("assignment_id", assignmentId).eq("step_key", stepKey));
  }
}

export async function reportBarrier(patientId: string, kind: Barrier["kind"], note: string | null, via: Barrier["reported_via"]) {
  unwrap(await supabase.from("barriers").insert({ patient_id: patientId, kind, note, reported_via: via }));
}

export async function resolveBarrier(id: string) {
  unwrap(await supabase.from("barriers").update({ status: "resolved" }).eq("id", id));
}

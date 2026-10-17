export type ReadingLevel = "simple" | "standard" | "detailed";

export type Patient = {
  id: string;
  display_name: string;
  age: number;
  guardian_name: string;
  preferred_language: string;
  reading_level: ReadingLevel;
  accessibility_needs: string[];
  procedure: string;
  scheduled_at: string;
  family_token: string;
};

export type PathwayStep = {
  pathway_id: string;
  key: string;
  title: string;
  audience: "child" | "parent";
  kind: "learn" | "practice" | "task";
  weight: number;
  sort: number;
};

export type Assignment = {
  id: string;
  patient_id: string;
  pathway_id: string;
  assigned_by: string;
  assigned_at: string;
};

export type StepProgress = {
  assignment_id: string;
  pathway_id: string;
  step_key: string;
  completed_at: string;
};

export type BarrierKind = "interpreter" | "transportation" | "cost" | "anxiety" | "scheduling" | "other";

export type Barrier = {
  id: string;
  patient_id: string;
  kind: BarrierKind;
  note: string | null;
  status: "open" | "resolved";
  reported_via: "app" | "sms" | "care_team";
  created_at: string;
};

export type Readiness = {
  assignment_id: string;
  patient_id: string;
  pathway_id: string;
  completed_weight: number;
  total_weight: number;
  readiness_pct: number;
};

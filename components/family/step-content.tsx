"use client";

import { useState } from "react";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Explainer } from "@/components/family/explainer";
import { MeetScanner } from "@/components/child/meet-scanner";
import { SoundPractice } from "@/components/child/sound-practice";
import { StillnessGame } from "@/components/child/stillness-game";
import { PREP_INSTRUCTIONS, SAFETY_SCREENING, SOURCE, UNDERSTAND_MRI } from "@/lib/pathway-content";
import { visitDate } from "@/lib/format";
import type { BarrierKind, PathwayStep, Patient } from "@/lib/types";

type Props = {
  step: PathwayStep;
  patient: Patient;
  done: boolean;
  onComplete: () => void;
  onUndo: () => void;
  onReportBarrier: (kind: BarrierKind, note: string) => void;
};

export function StepContent(props: Props) {
  const { step } = props;

  if (step.audience === "child") {
    const name = props.patient.display_name.split(" ")[0];
    return (
      <Body done={props.done} onUndo={props.onUndo}>
        {step.key === "meet-scanner" && <MeetScanner name={name} done={props.done} onComplete={props.onComplete} />}
        {step.key === "sound-practice" && <SoundPractice done={props.done} onComplete={props.onComplete} />}
        {step.key === "stillness-practice" && <StillnessGame done={props.done} onComplete={props.onComplete} />}
      </Body>
    );
  }

  switch (step.key) {
    case "understand-mri":
      return (
        <Body done={props.done} onUndo={props.onUndo}>
          <Paragraphs items={UNDERSTAND_MRI} />
          <Source />
          <Explainer step="understand-mri" defaultLevel={props.patient.reading_level} familyToken={props.patient.family_token} />
          <DoneButton {...props} label="I understand" />
        </Body>
      );
    case "safety-screening":
      return <SafetyScreening {...props} />;
    case "prep-instructions":
      return (
        <Body done={props.done} onUndo={props.onUndo}>
          <ul className="list-disc space-y-2 pl-5">
            {PREP_INSTRUCTIONS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Explainer step="prep-instructions" defaultLevel={props.patient.reading_level} familyToken={props.patient.family_token} />
          <DoneButton {...props} label="I've read these" />
        </Body>
      );
    case "confirm-visit":
      return (
        <Body done={props.done} onUndo={props.onUndo}>
          <p className="text-lg">
            {props.patient.procedure} on <strong>{visitDate(props.patient.scheduled_at)}</strong>.
          </p>
          {!props.done && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="h-11 px-4 text-base" onClick={props.onComplete}>
                <Check /> Yes, we&apos;ll be there
              </Button>
              <Button
                variant="outline"
                className="h-11 px-4 text-base"
                onClick={() => props.onReportBarrier("scheduling", "Family asked to reschedule")}
              >
                We need a different time
              </Button>
            </div>
          )}
        </Body>
      );
    default:
      return null;
  }
}

function SafetyScreening(props: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const all = SAFETY_SCREENING.remove;
  const ready = all.every((x) => checked.has(x));

  return (
    <Body done={props.done} onUndo={props.onUndo}>
      <h3 className="font-bold">Tell the care team if {props.patient.display_name.split(" ")[0]} has:</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {SAFETY_SCREENING.tell.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <Button
        variant="outline"
        className="mt-3 h-11 px-4 text-base"
        onClick={() => props.onReportBarrier("other", "Possible implant or metal: care team to review safety screening")}
      >
        One of these applies
      </Button>

      <h3 className="mt-6 font-bold">On the day, remove:</h3>
      <div className="mt-2 space-y-2">
        {all.map((item) => (
          <label key={item} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3">
            <input
              type="checkbox"
              className="size-5 accent-[var(--primary)]"
              checked={checked.has(item) || props.done}
              disabled={props.done}
              onChange={(e) => {
                const next = new Set(checked);
                if (e.target.checked) next.add(item);
                else next.delete(item);
                setChecked(next);
              }}
            />
            {item}
          </label>
        ))}
      </div>
      {!props.done && (
        <Button className="mt-4 h-11 px-4 text-base" disabled={!ready} onClick={props.onComplete}>
          <Check /> Safety check done
        </Button>
      )}
    </Body>
  );
}

function Body({ done, onUndo, children }: { done: boolean; onUndo: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {children}
      {done && (
        <div className="flex items-center gap-3 text-ready-ink">
          <Check className="size-5" /> <span className="font-bold">Done</span>
          <Button variant="ghost" size="sm" onClick={onUndo} className="text-muted-foreground">
            <RotateCcw /> Undo
          </Button>
        </div>
      )}
    </div>
  );
}

function Paragraphs({ items, large }: { items: string[]; large?: boolean }) {
  return (
    <div className="space-y-3">
      {items.map((t) => (
        <p key={t} className={large ? "text-xl leading-relaxed" : "leading-relaxed"}>
          {t}
        </p>
      ))}
    </div>
  );
}

function DoneButton(props: Props & { label: string }) {
  if (props.done) return null;
  return (
    <Button className="h-11 px-5 text-base" onClick={props.onComplete}>
      <Check /> {props.label}
    </Button>
  );
}

function Source() {
  return (
    <a
      href={SOURCE.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
    >
      Source: {SOURCE.label} <ExternalLink className="size-3.5" />
    </a>
  );
}

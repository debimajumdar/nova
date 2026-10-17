import type { Metadata } from "next";
import { CareBoard } from "@/components/care/care-board";

export const metadata: Metadata = { title: "PULSE · Care team" };

export default function CarePage() {
  return <CareBoard />;
}

import { z } from "zod";
import { serverSupabase } from "@/lib/supabase-server";

const ReviewSchema = z.object({
  id: z.uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional(),
});

// Records a clinician's decision on a pending AI draft. Only pending drafts can be decided, and only once.
// Prototype: the reviewer is a fixed demo identity; production needs authenticated clinician accounts.
export async function POST(req: Request) {
  const parsed = ReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { id, decision, note } = parsed.data;

  const { data, error } = await serverSupabase()
    .from("ai_rewrites")
    .update({
      status: decision,
      reviewed_by: "Care coordinator (demo)",
      reviewed_at: new Date().toISOString(),
      review_note: note ?? null,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return Response.json({ error: "Couldn't save the review." }, { status: 500 });
  if (!data) return Response.json({ error: "This draft was already reviewed." }, { status: 409 });
  return Response.json({ ok: true });
}

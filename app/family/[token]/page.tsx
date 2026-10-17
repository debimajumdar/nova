import type { Metadata } from "next";
import { Suspense } from "react";
import { FamilyView } from "@/components/family/family-view";

export const metadata: Metadata = { title: "NOVA · Getting ready" };

// The token is only known at request time, so read it inside Suspense (required with cacheComponents).
export default function FamilyPage({ params }: PageProps<"/family/[token]">) {
  return (
    <Suspense fallback={<p className="p-8 text-muted-foreground">Loading…</p>}>
      <FamilyRoute params={params} />
    </Suspense>
  );
}

async function FamilyRoute({ params }: { params: PageProps<"/family/[token]">["params"] }) {
  const { token } = await params;
  return <FamilyView token={token} />;
}

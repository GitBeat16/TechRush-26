import { Suspense } from "react";
import { PlanView } from "@/components/plan/PlanView";

/** Server Component — provides the Suspense boundary useSearchParams needs. */
export default function PlanPage() {
  return (
    <Suspense fallback={<PlanFallback />}>
      <PlanView />
    </Suspense>
  );
}

function PlanFallback() {
  return (
    <div className="space-y-6">
      <div className="h-24 rounded-clay-lg bg-clay-surface/70 shadow-clay-sm" />
      <div className="h-[34rem] rounded-clay-xl bg-clay-surface/70 shadow-clay-sm" />
    </div>
  );
}

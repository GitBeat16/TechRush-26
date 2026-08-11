"use client";

import { ComparisonCard } from "@/components/Dashboard/ComparisonCard";
import { PageHeader } from "@/components/shell/PageHeader";
import { SwapIcon } from "@/components/ui/Icons";

export default function ComparePage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Decide"
        title="Compare destinations"
        subtitle="Six signals, weighted for how you actually travel. Swap either side to see how the balance shifts."
        icon={<SwapIcon size={24} />}
      />

      <ComparisonCard />
    </div>
  );
}

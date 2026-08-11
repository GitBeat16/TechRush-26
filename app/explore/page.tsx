import { Suspense } from "react";
import { ExploreView } from "@/components/explore/ExploreView";

/**
 * A Server Component. It ships no JavaScript of its own — it exists to
 * provide the Suspense boundary that useSearchParams() needs inside
 * ExploreView, so the shell can still be prerendered.
 */
export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreView />
    </Suspense>
  );
}

function ExploreFallback() {
  return (
    <div className="space-y-6">
      <div className="h-28 rounded-clay-lg bg-clay-surface/70 shadow-clay-sm" />
      <div className="h-48 rounded-clay-lg bg-clay-surface/70 shadow-clay-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div key={key} className="h-80 rounded-clay-lg bg-clay-surface/70 shadow-clay-sm" />
        ))}
      </div>
    </div>
  );
}

import { ClayWell } from "@/components/ui/ClayCard";
import { BagIcon, CheckIcon } from "@/components/ui/Icons";
import type { PackingListWidget } from "@/types/assistant";

export function PackingListCard({ widget }: { widget: PackingListWidget }) {
  return (
    <ClayWell radius="md" className="mt-2.5 p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-raised text-clay-ocean shadow-clay-xs">
          <BagIcon size={13} />
        </span>
        <p className="font-display text-[13px] font-bold">Packing list</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {widget.categories.map((category) => (
          <div key={category.label} className="rounded-clay-sm bg-clay-surface/60 p-2.5">
            <p className="mb-1.5 font-body text-[10.5px] font-bold uppercase tracking-wide text-clay-muted">
              {category.label}
            </p>
            <ul className="space-y-1">
              {category.items.map((item) => (
                <li key={item} className="flex items-start gap-1.5 font-body text-[12.5px] text-clay-ink-soft">
                  <CheckIcon size={11} className="mt-0.5 shrink-0 text-clay-jade" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ClayWell>
  );
}

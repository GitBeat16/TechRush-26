import { ClayWell } from "@/components/ui/ClayCard";
import { WalletIcon } from "@/components/ui/Icons";
import type { BudgetBreakdownWidget } from "@/types/assistant";

export function BudgetBreakdownCard({ widget }: { widget: BudgetBreakdownWidget }) {
  return (
    <ClayWell radius="md" className="mt-2.5 p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-raised text-clay-jade shadow-clay-xs">
          <WalletIcon size={13} />
        </span>
        <p className="font-display text-[13px] font-bold">{widget.totalLabel}</p>
      </div>
      <div className="space-y-1.5">
        {widget.items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-clay-sm bg-clay-surface/60 px-3 py-2"
          >
            <span className="font-body text-[12.5px] text-clay-ink-soft">{item.label}</span>
            <span className="font-display text-[12.5px] font-bold">{item.amountLabel}</span>
          </div>
        ))}
      </div>
    </ClayWell>
  );
}

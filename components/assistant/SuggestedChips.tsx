"use client";

import { ClayChip } from "@/components/ui/ClayButton";
import { SUGGESTED_CHIPS } from "@/lib/assistant";

export function SuggestedChips({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_CHIPS.map((chip) => (
        <ClayChip
          key={chip.label}
          tone="peach"
          onClick={() => onPick(chip.prompt)}
          disabled={disabled}
          className="disabled:pointer-events-none disabled:opacity-50"
        >
          {chip.label}
        </ClayChip>
      ))}
    </div>
  );
}

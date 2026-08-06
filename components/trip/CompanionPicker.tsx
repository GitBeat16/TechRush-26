"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ClayButton, ClayChip } from "@/components/ui/ClayButton";
import { ClayWell } from "@/components/ui/ClayCard";
import { PlusIcon, TrashIcon, UsersIcon } from "@/components/ui/Icons";
import { popIn, springSnappy, springSoft } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { GROUP_LABEL, GROUP_SIZE } from "@/lib/personalize";
import { TONES } from "@/lib/tones";
import { makeTraveler } from "@/lib/travelers";
import type { TravelGroup } from "@/types/auth";
import type { Traveler } from "@/types/dashboard";

const GROUPS: TravelGroup[] = ["solo", "partner", "friends", "family"];

/**
 * "Who's coming?" — the piece the planner was missing.
 *
 * Two levels of answer: a group shape (solo / partner / friends / family),
 * which is enough to size a budget, and named companions, which is what
 * expense splitting actually needs. Naming people is optional; leaving them
 * unnamed still produces a correct per-head split.
 */
export function CompanionPicker({
  travelers,
  onChange,
  group,
  onGroupChange,
  /** Hides the group-shape row when the trip already exists. */
  showGroups = true,
}: {
  travelers: Traveler[];
  onChange: (travelers: Traveler[]) => void;
  group?: TravelGroup | null;
  onGroupChange?: (group: TravelGroup) => void;
  showGroups?: boolean;
}) {
  const { play } = useFeedback();
  const [draft, setDraft] = useState("");

  const companions = travelers.filter((traveler) => !traveler.isYou);

  function add(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (
      travelers.some(
        (traveler) => traveler.name.toLowerCase() === clean.toLowerCase(),
      )
    ) {
      setDraft("");
      return;
    }
    play("pop");
    onChange([...travelers, makeTraveler(clean, travelers.length)]);
    setDraft("");
  }

  function remove(id: string) {
    // A trip with nobody on it would divide every expense by zero, and there
    // would be no valid payer to fall back to.
    if (travelers.length <= 1) return;
    play("toggleOff");
    onChange(travelers.filter((traveler) => traveler.id !== id));
  }

  /**
   * Picking a group shape tops the roster up to the implied size with
   * placeholder companions, so a four-person split works before anyone has
   * been named. Shrinking only drops unnamed placeholders — it never
   * silently deletes someone the user typed in.
   */
  function pickGroup(next: TravelGroup) {
    play("tap");
    onGroupChange?.(next);

    const target = GROUP_SIZE[next];
    const self = travelers.filter((traveler) => traveler.isYou);
    const named = companions.filter(
      (traveler) => !/^Traveller \d+$/.test(traveler.name),
    );

    const roster = [...self, ...named];
    let index = roster.length;
    while (roster.length < target) {
      index += 1;
      roster.push(makeTraveler(`Traveller ${index}`, roster.length));
    }

    onChange(roster.slice(0, Math.max(target, self.length + named.length)));
  }

  return (
    <div className="space-y-3">
      {showGroups && (
        <div>
          <p className="mb-2 font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
            Who are you going with
          </p>
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((option) => (
              <ClayChip
                key={option}
                active={group === option}
                onClick={() => pickGroup(option)}
              >
                {GROUP_LABEL[option]}
              </ClayChip>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
          <UsersIcon size={13} />
          On this trip · {travelers.length}
        </p>

        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {travelers.map((traveler) => (
              <motion.span
                key={traveler.id}
                layout
                variants={popIn}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springSoft}
                className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 shadow-clay-xs ${
                  TONES[traveler.tone].bg
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-raised font-display text-[10px] font-bold shadow-clay-xs">
                  {traveler.initials}
                </span>
                <span className="font-display text-xs font-semibold">
                  {traveler.isYou ? "You" : traveler.name}
                </span>
                {!traveler.isYou && travelers.length > 1 && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.85 }}
                    transition={springSnappy}
                    onClick={() => remove(traveler.id)}
                    aria-label={`Remove ${traveler.name}`}
                    className="text-clay-ink-soft hover:text-clay-rose"
                  >
                    <TrashIcon size={13} />
                  </motion.button>
                )}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <ClayWell radius="sm" className="flex items-center gap-2 p-1.5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter inside a form would submit the planner, not add a person.
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            }
          }}
          placeholder="Add someone by name"
          maxLength={40}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 font-body text-sm outline-none placeholder:text-clay-muted"
        />
        <ClayButton
          size="sm"
          tone="mint"
          leftIcon={<PlusIcon size={14} />}
          disabled={!draft.trim()}
          onClick={() => add(draft)}
          sound={null}
        >
          Add
        </ClayButton>
      </ClayWell>
    </div>
  );
}

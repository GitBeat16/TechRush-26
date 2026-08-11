"use client";

import { useState } from "react";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayWell } from "@/components/ui/ClayCard";
import { ArrowRightIcon, LocationArrowIcon } from "@/components/ui/Icons";

export function ChatComposer({
  onSend,
  disabled,
  locationEnabled,
  onToggleLocation,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  locationEnabled: boolean;
  onToggleLocation: () => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="flex items-end gap-2">
      <ClayButton
        variant="icon"
        tone={locationEnabled ? "mint" : "surface"}
        size="md"
        onClick={onToggleLocation}
        aria-label={locationEnabled ? "Location shared" : "Share your location"}
        title={locationEnabled ? "Location shared" : "Share your location for nearby suggestions"}
        sound="toggleOn"
      >
        <LocationArrowIcon size={17} />
      </ClayButton>

      <ClayWell radius="lg" className="flex-1 px-4 py-2.5">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Ask about budget, itinerary, packing, weather..."
          disabled={disabled}
          className="w-full bg-transparent font-body text-[14px] text-clay-ink outline-none placeholder:text-clay-muted disabled:opacity-60"
          aria-label="Message"
        />
      </ClayWell>

      <ClayButton
        variant="primary"
        size="md"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        sound="press"
      >
        <ArrowRightIcon size={18} />
      </ClayButton>
    </div>
  );
}

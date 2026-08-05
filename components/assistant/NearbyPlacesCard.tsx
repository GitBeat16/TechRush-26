import { ClayWell } from "@/components/ui/ClayCard";
import { PinIcon } from "@/components/ui/Icons";
import type { NearbyPlacesWidget } from "@/types/assistant";

export function NearbyPlacesCard({ widget }: { widget: NearbyPlacesWidget }) {
  return (
    <ClayWell radius="md" className="mt-2.5 p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-raised text-clay-rose shadow-clay-xs">
          <PinIcon size={13} />
        </span>
        <p className="font-display text-[13px] font-bold">Nearby places</p>
      </div>
      <div className="space-y-1.5">
        {widget.places.map((place) => (
          <div
            key={place.name}
            className="flex items-center justify-between gap-3 rounded-clay-sm bg-clay-surface/60 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-body text-[12.5px] font-semibold text-clay-ink">{place.name}</p>
              <p className="font-body text-[11px] capitalize text-clay-muted">{place.category}</p>
            </div>
            <span className="shrink-0 font-display text-[11.5px] font-bold text-clay-ink-soft">
              {place.distanceKm} km
            </span>
          </div>
        ))}
      </div>
    </ClayWell>
  );
}

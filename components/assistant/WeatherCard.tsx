import { ClayWell } from "@/components/ui/ClayCard";
import { CloudIcon, SunIcon } from "@/components/ui/Icons";
import type { WeatherWidget } from "@/types/assistant";

export function WeatherCard({ widget }: { widget: WeatherWidget }) {
  const isClear = /clear/.test(widget.condition);

  return (
    <ClayWell radius="md" className="mt-2.5 p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-raised text-clay-tangerine shadow-clay-xs">
          {isClear ? <SunIcon size={19} /> : <CloudIcon size={19} />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-bold leading-tight">
            {widget.tempC}°C · {widget.location}
          </p>
          <p className="font-body text-[12px] capitalize text-clay-ink-soft">
            {widget.condition} · feels like {widget.feelsLikeC}°C · wind {widget.windKph} km/h
          </p>
        </div>
      </div>
    </ClayWell>
  );
}

"use client";

import { motion } from "framer-motion";
import { BudgetBreakdownCard } from "@/components/assistant/BudgetBreakdownCard";
import { FormattedText } from "@/components/assistant/FormattedText";
import { NearbyPlacesCard } from "@/components/assistant/NearbyPlacesCard";
import { PackingListCard } from "@/components/assistant/PackingListCard";
import { WeatherCard } from "@/components/assistant/WeatherCard";
import { ClayCard } from "@/components/ui/ClayCard";
import { PlaneIcon, UserIcon } from "@/components/ui/Icons";
import { fadeUp } from "@/lib/animations";
import type { AssistantWidget, ChatRole } from "@/types/assistant";

function Widget({ widget }: { widget: AssistantWidget }) {
  switch (widget.kind) {
    case "budget":
      return <BudgetBreakdownCard widget={widget} />;
    case "packing":
      return <PackingListCard widget={widget} />;
    case "nearby":
      return <NearbyPlacesCard widget={widget} />;
    case "weather":
      return <WeatherCard widget={widget} />;
    default:
      return null;
  }
}

export function ChatBubble({
  role,
  text,
  widget,
  pending = false,
}: {
  role: ChatRole;
  text: string;
  widget?: AssistantWidget | null;
  pending?: boolean;
}) {
  const isUser = role === "user";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-clay-xs ${
          isUser ? "bg-clay-butter text-clay-ink" : "bg-clay-sky text-clay-ink"
        }`}
      >
        {isUser ? <UserIcon size={14} /> : <PlaneIcon size={14} />}
      </span>

      <ClayCard
        tone={isUser ? "butter" : "surface"}
        radius="lg"
        depth="sm"
        className={`max-w-[85%] p-3.5 sm:max-w-[75%] ${isUser ? "" : "border border-clay-sunken"}`}
      >
        {pending ? (
          <span className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-clay-muted"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </span>
        ) : (
          <>
            <FormattedText text={text} />
            {widget && <Widget widget={widget} />}
          </>
        )}
      </ClayCard>
    </motion.div>
  );
}

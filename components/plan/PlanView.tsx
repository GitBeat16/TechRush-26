"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { AIPlanner } from "@/components/Dashboard/AIPlanner";
import { PageHeader } from "@/components/shell/PageHeader";
import { ClayCard } from "@/components/ui/ClayCard";
import { SparkIcon } from "@/components/ui/Icons";
import { fadeUp, revealViewport, stagger } from "@/lib/animations";

const TIPS = [
  {
    title: "Be vague on purpose",
    body: "\"Somewhere warm with good food\" gives the planner more room than a city name.",
    tone: "bg-clay-mint",
  },
  {
    title: "Budget shapes the pace",
    body: "A lower budget produces fewer paid activities and more open blocks, not a worse trip.",
    tone: "bg-clay-sky",
  },
  {
    title: "Save it, then edit it",
    body: "Every generated plan becomes a real trip you can drag, rename and cost out.",
    tone: "bg-clay-butter",
  },
];

export function PlanView() {
  const params = useSearchParams();
  const destination = params.get("destination") ?? "";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Wanderly AI"
        title="Plan with AI"
        subtitle="Describe the trip you want. Wanderly builds a day by day route around your budget, pace and interests — then saves it as a trip you can edit."
        icon={<SparkIcon size={24} />}
      />

      <AIPlanner key={destination} initialDestination={destination} />

      <motion.section
        variants={stagger(0.07)}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="grid gap-3 sm:grid-cols-3"
      >
        {TIPS.map((tip) => (
          <motion.div key={tip.title} variants={fadeUp}>
            <ClayCard tone="surface" radius="lg" depth="sm" interactive subtle className="h-full p-5">
              <span className={`mb-3 block h-2 w-12 rounded-full ${tip.tone}`} />
              <p className="font-display text-base font-semibold leading-tight">{tip.title}</p>
              <p className="mt-1.5 font-body text-xs leading-relaxed text-clay-ink-soft">
                {tip.body}
              </p>
            </ClayCard>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}

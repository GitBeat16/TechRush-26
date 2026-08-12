import { FLIPBOOK_DATA } from "@/data/flipbookData";
import Link from "next/link";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { PageHeader } from "@/components/shell/PageHeader";
import { ArrowRightIcon, BookOpenIcon } from "@/components/ui/Icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Travel Guide | Wanderly Digital Magazines",
  description:
    "Explore Wanderly's interactive 3D digital travel magazines for Japan, Bali, Switzerland, Vietnam, Portugal, and Iceland.",
};

// Per-destination fun facts and explore phrases
const DEST_META: Record<
  string,
  { fact: string; spots: [string, string, string]; phrase: string }
> = {
  japan: {
    fact: "Home to more Michelin-starred restaurants than any other country on Earth.",
    spots: ["Tokyo", "Kyoto", "Shibuya"],
    phrase: "and a world of wonders waiting for you",
  },
  bali: {
    fact: "The island has over 20,000 temples — more temples than houses in some villages.",
    spots: ["Seminyak", "Ubud", "Uluwatu"],
    phrase: "and endless sunsets that steal your breath",
  },
  switzerland: {
    fact: "Switzerland has four official languages and 208 mountains over 3,000 metres.",
    spots: ["Zurich", "Interlaken", "Lucerne"],
    phrase: "and alpine magic around every corner",
  },
  vietnam: {
    fact: "Vietnam's coastline stretches over 3,200 km — one of Southeast Asia's longest.",
    spots: ["Hanoi", "Hội An", "Ha Long Bay"],
    phrase: "and rich stories woven into every street",
  },
  portugal: {
    fact: "Portugal is the world's largest producer of cork, and Lisbon is older than Rome.",
    spots: ["Lisbon", "Porto", "Sintra"],
    phrase: "and golden light that never seems to fade",
  },
  iceland: {
    fact: "Iceland is the only country in the world with no mosquitoes.",
    spots: ["Reykjavík", "Akureyri", "Vik"],
    phrase: "and landscapes straight out of another world",
  },
};

export default function DestinationsIndexPage() {
  const destinations = Object.values(FLIPBOOK_DATA);

  return (
    <div className="space-y-10 sm:space-y-12">
      <PageHeader
        eyebrow="Digital Travel Magazines"
        title="Your Travel Guide"
        subtitle="Open interactive 3D travel magazines for Japan, Bali, Switzerland, Vietnam, Portugal, and Iceland."
        icon={<BookOpenIcon size={24} />}
      />

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
        {destinations.map((dest) => {
          const meta = DEST_META[dest.id];
          return (
            <Link
              key={dest.id}
              href={`/destinations/${dest.id}`}
              className="group block h-full"
            >
              <ClayCard
                tone="surface"
                radius="xl"
                depth="md"
                interactive
                className="h-full overflow-hidden p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group-hover:shadow-clay-xl border border-white/60 group-hover:-translate-y-1.5 group-hover:scale-[1.025]"
              >
                {/* ---- Image with hover overlay ---- */}
                <div className="relative h-60 sm:h-72 w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-clay-md mb-5">
                  <img
                    src={dest.coverImage}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ objectPosition: dest.coverPosition ?? "center center" }}
                  />

                  {/* Base gradient (always visible) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />

                  {/* Darkening overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />

                  {/* Region badge (always visible) */}
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full text-white border border-white/20 text-xs font-body font-bold uppercase tracking-wider z-10">
                    {dest.region}
                  </div>

                  {/* Default bottom title */}
                  <div className="absolute bottom-4 left-5 right-5 text-white z-10 transition-opacity duration-300 group-hover:opacity-0">
                    <h3 className="font-display text-4xl sm:text-5xl font-black uppercase text-white drop-shadow-md tracking-tight">
                      {dest.name}
                    </h3>
                  </div>

                  {/* Hover overlay content */}
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <p className="font-body text-sm sm:text-base font-medium text-white/90 leading-relaxed drop-shadow-md">
                      {meta?.fact}
                    </p>
                    <p className="mt-4 font-body text-xs sm:text-sm text-white/70">
                      Explore{" "}
                      <span className="text-white font-semibold">
                        {meta?.spots[0]}, {meta?.spots[1]}, {meta?.spots[2]}
                      </span>{" "}
                      {meta?.phrase}.
                    </p>
                  </div>
                </div>

                {/* ---- Quote below image ---- */}
                <p className="font-body text-sm sm:text-base text-clay-ink-soft italic px-1 mb-4 leading-relaxed">
                  "{dest.subtitle}"
                </p>

                {/* ---- CTA ---- */}
                <div className="pt-4 border-t border-clay-muted/15 flex items-center justify-end px-1">
                  <ClayButton
                    size="md"
                    tone="surface"
                    rightIcon={<ArrowRightIcon size={16} />}
                  >
                    Read Magazine
                  </ClayButton>
                </div>
              </ClayCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { FLIPBOOK_DATA } from "@/data/flipbookData";
import { DestinationFlipbook } from "@/components/flipbook/DestinationFlipbook";
import Link from "next/link";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCard } from "@/components/ui/ClayCard";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = FLIPBOOK_DATA[slug.toLowerCase()];
  if (!destination) return { title: "Destination Not Found | Wanderly" };
  return {
    title: `${destination.name} Travel Magazine & Guide | Wanderly`,
    description: `Explore ${destination.name} in Wanderly's interactive digital travel magazine. Discover top attractions, best experiences, and travel tips.`,
  };
}

export default async function DestinationFlipbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = FLIPBOOK_DATA[slug.toLowerCase()];

  if (!destination) {
    return (
      <div className="min-h-screen bg-clay-bg flex flex-col items-center justify-center p-6 text-center">
        <ClayCard tone="surface" radius="lg" depth="md" className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-clay-tangerine/20 text-clay-tangerine flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h1 className="font-display text-2xl font-bold text-clay-ink">Destination Not Found</h1>
          <p className="font-body text-sm text-clay-ink-soft">
            We couldn't find a travel magazine flipbook for "{slug}". Explore our available destinations below.
          </p>
          <div className="pt-2">
            <Link href="/explore">
              <ClayButton tone="mint" size="md">
                Explore Destinations
              </ClayButton>
            </Link>
          </div>
        </ClayCard>
      </div>
    );
  }

  return <DestinationFlipbook destination={destination} />;
}

import { tripLength } from "@/lib/dates";
import type { TripClimate } from "@/lib/weather";
import type { Destination, PackingCategory } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Packing suggestions                                                 */
/*                                                                     */
/* Rules, not a model. Three reasons:                                   */
/*   · every suggestion can state exactly why it appeared, and the      */
/*     reason is checkable ("lows near 4°C" is either true or it is not) */
/*   · it works offline and costs nothing                               */
/*   · it is deterministic, so it can be tested                         */
/*                                                                     */
/* The weather half only runs when there is real weather to run it on.  */
/* With no forecast the list falls back to the things that are true of  */
/* every trip, and says so — it never guesses at a season.              */
/* ------------------------------------------------------------------ */

/** Keys into the clay object drawings in components/ui/ClayPackables. */
export type PackableIcon =
  | "tshirt"
  | "jacket"
  | "coat"
  | "trousers"
  | "shorts"
  | "socks"
  | "shoes"
  | "boots"
  | "sandals"
  | "swimsuit"
  | "hat"
  | "sunhat"
  | "gloves"
  | "scarf"
  | "sunglasses"
  | "sunscreen"
  | "umbrella"
  | "raincoat"
  | "passport"
  | "ticket"
  | "wallet"
  | "charger"
  | "powerbank"
  | "adapter"
  | "camera"
  | "headphones"
  | "bottle"
  | "medkit"
  | "toiletries"
  | "book"
  | "daypack"
  | "item";

export interface Suggestion {
  /** Stable id so a suggestion can be matched against what is already packed. */
  id: string;
  label: string;
  category: PackingCategory;
  icon: PackableIcon;
  /** Why this is on the list, in the user's words. */
  reason: string;
  /** Sorted ascending: 0 is "you cannot travel without this". */
  priority: number;
}

interface Input {
  destination: Destination | null;
  /** Days the trip runs, inclusive. */
  days: number;
  climate: TripClimate | null;
  /** True when the destination is in a different country to the traveller. */
  abroad: boolean;
}

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function make(
  label: string,
  category: PackingCategory,
  icon: PackableIcon,
  reason: string,
  priority: number,
): Suggestion {
  return { id: slug(label), label, category, icon, reason, priority };
}

/**
 * How many of a thing to bring: one per day up to a week, then assume a wash.
 * Nobody packs fourteen t-shirts for a fortnight.
 */
function quantity(days: number): number {
  return Math.max(1, Math.min(days, 7));
}

export function suggestPacking({
  destination,
  days,
  climate,
  abroad,
}: Input): Suggestion[] {
  const out: Suggestion[] = [];
  const count = quantity(days);
  const vibes = destination?.vibes ?? [];
  const has = (vibe: string) => vibes.includes(vibe);

  /* ------------------------------------------------- always, every trip */

  if (abroad) {
    out.push(make("Passport", "Documents", "passport", "Crossing a border", 0));
    out.push(
      make("Travel insurance", "Documents", "ticket", "Crossing a border", 1),
    );
  }
  out.push(make("Tickets and bookings", "Documents", "ticket", "Every trip", 1));
  out.push(make("Wallet and cards", "Documents", "wallet", "Every trip", 0));
  out.push(make("Phone charger", "Electronics", "charger", "Every trip", 0));
  out.push(
    make("Toiletries", "Essentials", "toiletries", `${days} days away`, 2),
  );
  out.push(make("Medicines", "Essentials", "medkit", "Every trip", 2));

  if (abroad) {
    out.push(
      make("Travel adapter", "Electronics", "adapter", "Different sockets", 2),
    );
  }
  if (days >= 3) {
    out.push(make("Power bank", "Electronics", "powerbank", "Long days out", 3));
  }

  /* --------------------------------------------------------- base clothes */

  out.push(
    make(`T-shirts ×${count}`, "Clothes", "tshirt", `${days}-day trip`, 2),
  );
  out.push(make(`Socks ×${count}`, "Clothes", "socks", `${days}-day trip`, 2),);
  out.push(
    make("Comfortable shoes", "Clothes", "shoes", "You will walk more than you think", 2),
  );

  /* ------------------------------------------------------------- weather */

  if (climate) {
    const { minC, maxC, averageHighC, rainDays, snowDays } = climate;

    if (minC <= 5) {
      out.push(
        make("Warm coat", "Clothes", "coat", `Lows near ${minC}°C`, 0),
      );
      out.push(make("Gloves", "Clothes", "gloves", `Lows near ${minC}°C`, 1));
      out.push(make("Scarf", "Clothes", "scarf", `Lows near ${minC}°C`, 2));
      out.push(
        make("Thermal layers", "Clothes", "trousers", `Lows near ${minC}°C`, 1),
      );
    } else if (minC <= 14) {
      out.push(
        make("Light jacket", "Clothes", "jacket", `Evenings around ${minC}°C`, 1),
      );
    }

    if (maxC >= 28) {
      out.push(
        make("Sunscreen", "Essentials", "sunscreen", `Highs of ${maxC}°C`, 0),
      );
      out.push(make("Sun hat", "Clothes", "sunhat", `Highs of ${maxC}°C`, 1));
      out.push(
        make("Sunglasses", "Essentials", "sunglasses", `Highs of ${maxC}°C`, 1),
      );
      out.push(
        make(`Shorts ×${Math.ceil(count / 2)}`, "Clothes", "shorts", `Highs of ${maxC}°C`, 2),
      );
      out.push(
        make("Water bottle", "Essentials", "bottle", `Highs of ${maxC}°C`, 1),
      );
    } else if (averageHighC >= 22) {
      out.push(
        make("Sunscreen", "Essentials", "sunscreen", `Averaging ${averageHighC}°C`, 2),
      );
    }

    if (rainDays >= 1) {
      const when = rainDays === 1 ? "Rain on one day" : `Rain on ${rainDays} days`;
      out.push(make("Compact umbrella", "Essentials", "umbrella", when, 1));
      if (rainDays >= 3) {
        out.push(make("Rain jacket", "Clothes", "raincoat", when, 1));
      }
    }

    if (snowDays >= 1) {
      out.push(
        make(
          "Waterproof boots",
          "Clothes",
          "boots",
          snowDays === 1 ? "Snow on one day" : `Snow on ${snowDays} days`,
          0,
        ),
      );
    }
  }

  /* --------------------------------------------------------------- vibes */

  if (has("Beaches")) {
    out.push(make("Swimwear", "Clothes", "swimsuit", "Beach destination", 1));
    out.push(make("Sandals", "Clothes", "sandals", "Beach destination", 2));
  }
  if (has("Hiking") || has("Adventure")) {
    out.push(make("Hiking boots", "Clothes", "boots", "Trails on the itinerary", 1));
    out.push(make("Day pack", "Essentials", "daypack", "Trails on the itinerary", 2));
    out.push(make("Water bottle", "Essentials", "bottle", "Trails on the itinerary", 1));
  }
  if (has("Culture")) {
    out.push(
      make(
        "Shoulder cover",
        "Clothes",
        "scarf",
        "Temples and churches often ask for covered shoulders",
        2,
      ),
    );
  }
  if (has("Scenic") || has("Nature")) {
    out.push(make("Camera", "Electronics", "camera", "Worth photographing", 3));
  }
  if (has("Cities")) {
    out.push(make("Day bag", "Essentials", "daypack", "City days", 3));
  }
  if (days >= 5) {
    out.push(make("Headphones", "Electronics", "headphones", "Long journeys", 3));
    out.push(make("Something to read", "Essentials", "book", "Long journeys", 4));
  }

  /* ------------------------------------------------------------ finalise */

  // Later rules can repeat an earlier item (a water bottle is both a hot-day
  // and a hiking thing). First mention wins, because the earlier rule is the
  // more specific one about *this* trip.
  const seen = new Set<string>();
  return out
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
}

/* ------------------------------------------------------------------ */
/* Guessing an object for something the user typed                     */
/* ------------------------------------------------------------------ */

const KEYWORDS: [RegExp, PackableIcon][] = [
  [/passport/i, "passport"],
  [/visa|ticket|boarding|booking|insurance/i, "ticket"],
  [/wallet|card|cash|money|purse/i, "wallet"],
  [/charger|cable|cord/i, "charger"],
  [/power ?bank|battery/i, "powerbank"],
  [/adapter|adaptor|plug|socket/i, "adapter"],
  [/camera|gopro|lens/i, "camera"],
  [/headphone|earbud|airpod|buds/i, "headphones"],
  [/bottle|flask/i, "bottle"],
  [/medicine|pill|tablet|first aid|meds|plaster/i, "medkit"],
  [/toothbrush|toiletr|shampoo|soap|razor|wash/i, "toiletries"],
  [/book|kindle|magazine|journal/i, "book"],
  [/backpack|day ?pack|rucksack|day ?bag|tote/i, "daypack"],
  [/sunscreen|spf|sunblock/i, "sunscreen"],
  [/sunglass|shades/i, "sunglasses"],
  [/umbrella/i, "umbrella"],
  [/rain ?coat|rain ?jacket|poncho|shell/i, "raincoat"],
  [/coat|parka|puffer/i, "coat"],
  [/jacket|hoodie|fleece|jumper|sweater/i, "jacket"],
  [/glove|mitten/i, "gloves"],
  [/scarf|shawl|stole|muffler/i, "scarf"],
  [/swim|bikini|trunks|costume/i, "swimsuit"],
  [/sandal|flip.?flop|slipper/i, "sandals"],
  [/boot/i, "boots"],
  [/shoe|sneaker|trainer|footwear/i, "shoes"],
  [/sock/i, "socks"],
  [/short/i, "shorts"],
  [/jean|trouser|pant|legging|thermal/i, "trousers"],
  [/sun ?hat|straw hat/i, "sunhat"],
  [/hat|cap|beanie/i, "hat"],
  [/shirt|tee|top|dress|kurta/i, "tshirt"],
];

/** Pick an object for a free-typed item. Falls back to a generic parcel. */
export function iconFor(label: string): PackableIcon {
  const match = KEYWORDS.find(([pattern]) => pattern.test(label));
  return match ? match[1] : "item";
}

/** Which drawer a free-typed item most likely belongs in. */
export function categoryFor(label: string): PackingCategory {
  const icon = iconFor(label);
  if (["passport", "ticket", "wallet"].includes(icon)) return "Documents";
  if (["charger", "powerbank", "adapter", "camera", "headphones"].includes(icon)) {
    return "Electronics";
  }
  if (
    [
      "tshirt", "jacket", "coat", "trousers", "shorts", "socks", "shoes",
      "boots", "sandals", "swimsuit", "hat", "sunhat", "gloves", "scarf",
      "raincoat",
    ].includes(icon)
  ) {
    return "Clothes";
  }
  return "Essentials";
}

/** One line describing the weather the list was built from. */
export function describeClimate(climate: TripClimate): string {
  const parts = [`${climate.minC}–${climate.maxC}°C`];
  if (climate.rainDays > 0) {
    parts.push(
      climate.rainDays === 1 ? "rain on one day" : `rain on ${climate.rainDays} days`,
    );
  }
  if (climate.snowDays > 0) {
    parts.push(
      climate.snowDays === 1 ? "snow on one day" : `snow on ${climate.snowDays} days`,
    );
  }
  return parts.join(" · ");
}

/** Trip length in days, for the rules above. */
export function daysFor(startIso: string, endIso: string, fallback: number): number {
  const span = tripLength(startIso, endIso);
  return span > 0 ? span : Math.max(1, fallback);
}

import type {
  AssistantWidget,
  BudgetBreakdownWidget,
  BudgetItem,
  ChatHistoryEntry,
  PackingCategory,
  PackingListWidget,
} from "@/types/assistant";

/**
 * Domain logic for the AI travel assistant chat.
 *
 * Isomorphic — imported by both the client (suggested chips) and the
 * /api/chat route (prompt building, intent detection, validation, and the
 * offline fallback). No env vars, no fs, no network calls here — those
 * live in services/groq.ts, services/geo.ts and services/weather.ts.
 */

export const SUGGESTED_CHIPS: { label: string; prompt: string }[] = [
  { label: "🏖 Goa", prompt: "My budget is ₹15,000 for 4 days. Suggest a complete Goa itinerary." },
  { label: "🏔 Manali", prompt: "Plan a 5 day trip to Manali for a weekend getaway." },
  { label: "💰 Budget planner", prompt: "I have ₹25,000 for a trip. Help me plan a budget breakdown." },
  { label: "📍 Nearby places", prompt: "Suggest nearby tourist places I can visit right now." },
  { label: "🎒 Packing list", prompt: "I'm travelling to Ladakh in December. What should I pack?" },
  { label: "🌦 Weather advice", prompt: "Is it good to visit Munnar next weekend?" },
];

export const ASSISTANT_SYSTEM_PROMPT = `You are Wanderly AI, an intelligent travel assistant built into the Wanderly app.

Your responsibilities include:
- Planning trips based on budget (any trip type: solo, couple, family, friends, luxury, weekend getaway)
- Recommending hotels, restaurants, street food and hidden gems
- Creating day-by-day itineraries
- Estimating travel expenses
- Suggesting transport options (bus, train, flight, rental bike, taxi)
- Giving weather-based travel advice
- Creating packing lists
- Suggesting nearby attractions, events and photography spots

Always answer in a friendly, concise, well-structured format using short paragraphs and bullet points — never a wall of text. Use Indian Rupees (₹) by default unless the traveller names another currency.

When the user gives a budget, break it down across accommodation, transport, food, activities and an emergency fund, and recommend realistic options within that budget.

When real weather or nearby-place data is supplied to you below as CONTEXT, treat it as ground truth and build your answer around it — never invent numbers that contradict it.

If the user asks for a budget breakdown or a packing list specifically, end your reply with exactly one fenced JSON block (\`\`\`json ... \`\`\`) matching one of these two shapes — nothing else in the fence, and only when it truly applies:

Budget breakdown:
{"kind":"budget","totalLabel":"₹25,000 total","items":[{"label":"Accommodation","amountLabel":"₹7,000"},{"label":"Transport","amountLabel":"₹6,000"},{"label":"Food","amountLabel":"₹5,000"},{"label":"Activities","amountLabel":"₹5,000"},{"label":"Emergency fund","amountLabel":"₹2,000"}]}

Packing list:
{"kind":"packing","categories":[{"label":"Clothes","items":["Thermal layers","Windproof jacket"]},{"label":"Documents","items":["ID proof","Permits"]},{"label":"Medicine","items":["Altitude sickness tablets"]},{"label":"Accessories","items":["Power bank","Sunglasses"]}]}

Do not emit a JSON block for any other kind of question — nearby places and weather are handled separately and already have real data if it was found.`;

/* ------------------------------------------------------------------ */
/* Intent detection — plain heuristics, no model call needed            */
/* ------------------------------------------------------------------ */

export function wantsNearby(message: string): boolean {
  return /\b(nearby|near me|around me|close by|close to me)\b/i.test(message);
}

export function wantsWeather(message: string): boolean {
  return /\b(weather|forecast|climate|good time to visit|good to visit|rain|temperature)\b/i.test(message);
}

export function wantsPacking(message: string): boolean {
  return /\b(pack|packing|what to (bring|carry))\b/i.test(message);
}

/** Best-effort place name pulled from phrases like "trip to Goa" or "visit Munnar". */
export function extractLocationName(message: string): string | null {
  const match = message.match(
    /\b(?:to|in|near|around|visit|visiting)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/,
  );
  if (!match) return null;
  return match[1].trim();
}

/** Parses a rupee figure from "₹25,000", "Rs 25000", "25k budget", etc. */
export function extractBudgetAmount(message: string): number | null {
  const match = message.match(/(?:₹|rs\.?|inr)\s?([\d,]+(?:\.\d+)?)\s?(k)?/i);
  if (!match) return null;
  const raw = parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(raw)) return null;
  return match[2] ? raw * 1000 : raw;
}

/* ------------------------------------------------------------------ */
/* Widget validation — never render unvalidated model output directly  */
/* ------------------------------------------------------------------ */

function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function coerceBudgetWidget(raw: unknown, totalAmount: number): BudgetBreakdownWidget {
  const value = (raw ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(value.items) ? value.items : [];

  const items: BudgetItem[] = rawItems
    .slice(0, 6)
    .map((item) => {
      const entry = (item ?? {}) as Record<string, unknown>;
      return {
        label: String(entry.label ?? "Other").slice(0, 30),
        amountLabel: String(entry.amountLabel ?? "").slice(0, 20) || "—",
      };
    })
    .filter((item) => item.amountLabel !== "—");

  if (items.length > 0) {
    return {
      kind: "budget",
      totalLabel: String(value.totalLabel ?? formatInr(totalAmount)).slice(0, 30),
      items,
    };
  }

  return localBudgetWidget(totalAmount);
}

/** Deterministic split used offline, or when the model's JSON doesn't parse. */
export function localBudgetWidget(totalAmount: number): BudgetBreakdownWidget {
  const split: { label: string; share: number }[] = [
    { label: "Accommodation", share: 0.3 },
    { label: "Transport", share: 0.25 },
    { label: "Food", share: 0.2 },
    { label: "Activities", share: 0.15 },
    { label: "Emergency fund", share: 0.1 },
  ];

  return {
    kind: "budget",
    totalLabel: `${formatInr(totalAmount)} total`,
    items: split.map((row) => ({
      label: row.label,
      amountLabel: formatInr(totalAmount * row.share),
    })),
  };
}

export function coercePackingWidget(raw: unknown): PackingListWidget | null {
  const value = (raw ?? {}) as Record<string, unknown>;
  const rawCategories = Array.isArray(value.categories) ? value.categories : [];

  const categories: PackingCategory[] = rawCategories
    .slice(0, 6)
    .map((category) => {
      const entry = (category ?? {}) as Record<string, unknown>;
      const items = Array.isArray(entry.items)
        ? entry.items.map((item) => String(item).slice(0, 40)).slice(0, 10)
        : [];
      return { label: String(entry.label ?? "Other").slice(0, 24), items };
    })
    .filter((category) => category.items.length > 0);

  return categories.length > 0 ? { kind: "packing", categories } : null;
}

/** Generic offline packing list — not destination-aware, but always useful. */
export function localPackingWidget(): PackingListWidget {
  return {
    kind: "packing",
    categories: [
      { label: "Clothes", items: ["Weather-appropriate layers", "Comfortable walking shoes", "Sleepwear"] },
      { label: "Documents", items: ["ID proof", "Tickets & bookings", "Travel insurance"] },
      { label: "Medicine", items: ["Basic first-aid kit", "Any prescription medicine", "Motion sickness tablets"] },
      { label: "Accessories", items: ["Power bank", "Reusable water bottle", "Sunscreen"] },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Offline reply — used when GROQ_API_KEY is unset or the call fails    */
/* ------------------------------------------------------------------ */

export function localAssistantReply(
  message: string,
  hadLocation = false,
): { reply: string; widget: AssistantWidget | null } {
  const budgetAmount = extractBudgetAmount(message);
  if (budgetAmount) {
    const widget = localBudgetWidget(budgetAmount);
    return {
      reply: `Here's a starting split for ${formatInr(budgetAmount)}. Accommodation and transport usually eat the biggest share — trim activities first if you need more room, and keep the emergency fund untouched.`,
      widget,
    };
  }

  if (wantsPacking(message)) {
    return {
      reply: "Here's a general packing list to start from — tell me the destination and month and I can tailor it further.",
      widget: localPackingWidget(),
    };
  }

  if (wantsWeather(message)) {
    return {
      reply: "I couldn't pin down real weather data for that just now — tell me the destination name plainly (e.g. \"weather in Munnar\") and I'll pull current conditions.",
      widget: null,
    };
  }

  if (wantsNearby(message)) {
    return {
      reply: hadLocation
        ? "I couldn't find real nearby data just now — mind trying again in a moment?"
        : "Share your location (tap the location button) and I'll pull real nearby attractions with distances.",
      widget: null,
    };
  }

  return {
    reply: "Tell me your budget, destination, or trip length and I'll put together an itinerary, budget split, or packing list — whatever you need first.",
    widget: null,
  };
}

/** Keeps the message list Groq sees bounded, most recent last. */
export function trimHistory(history: ChatHistoryEntry[], maxTurns = 8): ChatHistoryEntry[] {
  return history.slice(-maxTurns);
}

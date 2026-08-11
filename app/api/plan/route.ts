import type {
  ActivityCategory,
  GeneratedPlan,
  PlannerState,
} from "@/types/dashboard";

/**
 * POST /api/plan
 *
 * Runs on the server, so the API key never reaches the browser.
 * If ANTHROPIC_API_KEY is not set, a deterministic local planner answers
 * instead — the app stays fully usable without any credentials.
 */

export const runtime = "nodejs";

const MODEL = process.env.WANDERLY_MODEL ?? "claude-sonnet-5";
const API_URL = "https://api.anthropic.com/v1/messages";

const CATEGORIES: ActivityCategory[] = [
  "sight",
  "food",
  "travel",
  "stay",
  "activity",
  "free",
];

export async function POST(request: Request) {
  let input: PlannerState;

  try {
    input = (await request.json()) as PlannerState;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const state = normalise(input);
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return Response.json(localPlan(state));
  }

  try {
    const plan = await modelPlan(state, key);
    return Response.json(plan);
  } catch (error) {
    console.error("[plan] model call failed, using local planner:", error);
    return Response.json(localPlan(state));
  }
}

/* ------------------------------------------------------------------ */
/* Input hygiene — never trust the client                              */
/* ------------------------------------------------------------------ */

function normalise(input: Partial<PlannerState>): PlannerState {
  const duration = clamp(Number(input.duration) || 5, 1, 21);
  return {
    destination: String(input.destination ?? "").slice(0, 80).trim() || "Kyoto",
    budget: clamp(Number(input.budget) || 60000, 5000, 2000000),
    duration,
    style: (["Relaxed", "Adventure", "Culture", "Luxury"] as const).includes(
      input.style as never,
    )
      ? (input.style as PlannerState["style"])
      : "Relaxed",
    interests: Array.isArray(input.interests)
      ? input.interests.slice(0, 8).map((interest) => String(interest).slice(0, 30))
      : [],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/* ------------------------------------------------------------------ */
/* The model path                                                      */
/* ------------------------------------------------------------------ */

function buildPrompt(state: PlannerState) {
  return `You are a travel planner. Build a ${state.duration}-day trip to ${state.destination}.

Traveller profile:
- Total budget: INR ${state.budget}
- Pace: ${state.style}
- Interests: ${state.interests.length ? state.interests.join(", ") : "open to anything"}

Rules:
- Costs are per person in INR, whole numbers, and must roughly sum to the budget once flights and stays are accounted for.
- 3 to 5 activities per day. Include at least one free or unscheduled block across the trip.
- category must be one of: sight, food, travel, stay, activity, free.
- time is 24-hour "HH:MM".
- Keep every note under 90 characters and practical, not flowery.
- No emoji anywhere.

Reply with JSON only, no prose and no code fences, matching exactly:
{
  "title": "string",
  "destination": "string",
  "summary": "one sentence under 140 characters",
  "estimatedTotal": number,
  "days": [
    { "label": "Day 1 · short title",
      "items": [ { "time": "09:00", "title": "string", "note": "string", "cost": 0, "category": "sight" } ] }
  ],
  "packingSuggestions": ["6 to 10 short items specific to this destination and season"]
}`;
}

async function modelPlan(state: PlannerState, key: string): Promise<GeneratedPlan> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        messages: [{ role: "user", content: buildPrompt(state) }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Model responded ${response.status}`);
    }

    const payload = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };

    const text =
      payload.content
        ?.filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("") ?? "";

    return { ...coercePlan(JSON.parse(extractJson(text)), state), source: "model" };
  } finally {
    clearTimeout(timeout);
  }
}

/** Models sometimes wrap JSON in prose or fences. Pull out the object. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return text.slice(start, end + 1);
}

/** Never render unvalidated model output straight into the UI. */
function coercePlan(raw: unknown, state: PlannerState): Omit<GeneratedPlan, "source"> {
  const value = (raw ?? {}) as Record<string, unknown>;
  const days = Array.isArray(value.days) ? value.days : [];

  const cleanDays = days.slice(0, 21).map((day, index) => {
    const dayValue = (day ?? {}) as Record<string, unknown>;
    const items = Array.isArray(dayValue.items) ? dayValue.items : [];

    return {
      label: String(dayValue.label ?? `Day ${index + 1}`).slice(0, 60),
      items: items.slice(0, 8).map((item) => {
        const itemValue = (item ?? {}) as Record<string, unknown>;
        const category = String(itemValue.category ?? "activity") as ActivityCategory;
        return {
          time: String(itemValue.time ?? "09:00").slice(0, 5),
          title: String(itemValue.title ?? "Activity").slice(0, 80),
          note: String(itemValue.note ?? "").slice(0, 120),
          cost: clamp(Number(itemValue.cost) || 0, 0, 500000),
          category: CATEGORIES.includes(category) ? category : "activity",
        };
      }),
    };
  });

  const packing = Array.isArray(value.packingSuggestions)
    ? value.packingSuggestions.slice(0, 12).map((item) => String(item).slice(0, 40))
    : [];

  return {
    title: String(value.title ?? `${state.duration} days in ${state.destination}`).slice(0, 70),
    destination: String(value.destination ?? state.destination).slice(0, 60),
    summary: String(value.summary ?? "").slice(0, 200),
    estimatedTotal: clamp(Number(value.estimatedTotal) || state.budget, 0, 5000000),
    days: cleanDays.length ? cleanDays : localPlan(state).days,
    packingSuggestions: packing.length ? packing : localPlan(state).packingSuggestions,
  };
}

/* ------------------------------------------------------------------ */
/* The offline path — deterministic, and good enough to demo           */
/* ------------------------------------------------------------------ */

const PACE: Record<PlannerState["style"], { perDay: number; start: string[] }> = {
  Relaxed: { perDay: 3, start: ["10:00", "13:30", "18:00"] },
  Adventure: { perDay: 5, start: ["07:00", "10:00", "13:00", "16:00", "19:30"] },
  Culture: { perDay: 4, start: ["09:00", "12:00", "15:30", "19:00"] },
  Luxury: { perDay: 4, start: ["10:30", "13:00", "16:30", "20:00"] },
};

const BY_INTEREST: Record<string, { title: string; note: string; category: ActivityCategory }> = {
  Food: { title: "Local food walk", note: "Small plates, several stops, pay as you go", category: "food" },
  Nature: { title: "Green half day", note: "Park, garden or short trail near the centre", category: "sight" },
  Museums: { title: "Museum block", note: "Book the timed entry the night before", category: "sight" },
  Nightlife: { title: "Evening out", note: "Start late, stay in one neighbourhood", category: "activity" },
  Shopping: { title: "Market morning", note: "Cash helps, and go early for the good stalls", category: "activity" },
  Hiking: { title: "Trail day", note: "Pack water and leave before the heat", category: "activity" },
  Beaches: { title: "Coast afternoon", note: "Shade, swim, nothing scheduled after", category: "sight" },
  Photography: { title: "Golden hour route", note: "Two viewpoints, twenty minutes apart", category: "sight" },
};

function localPlan(state: PlannerState): GeneratedPlan {
  const pace = PACE[state.style];
  const interests = state.interests.length ? state.interests : ["Food", "Nature"];
  const perDayBudget = Math.round((state.budget * 0.35) / state.duration);

  const days = Array.from({ length: state.duration }, (_, index) => {
    const dayNumber = index + 1;
    const items: GeneratedPlan["days"][number]["items"] = [];

    if (dayNumber === 1) {
      items.push({
        time: "09:40",
        title: `Arrive in ${state.destination}`,
        note: "Transfer, drop bags, adjust to the time",
        cost: Math.round(state.budget * 0.04),
        category: "travel",
      });
      items.push({
        time: "14:00",
        title: "Check in and reset",
        note: "Short walk around the block, early dinner",
        cost: Math.round(state.budget * 0.06),
        category: "stay",
      });
      items.push({
        time: "19:00",
        title: "First evening, no plan",
        note: "Eat near where you are staying",
        cost: Math.round(perDayBudget * 0.3),
        category: "food",
      });
    } else if (dayNumber === state.duration && state.duration > 1) {
      items.push({
        time: "09:30",
        title: "Last morning, favourites",
        note: "Return to the one place you want to see again",
        cost: Math.round(perDayBudget * 0.2),
        category: "free",
      });
      items.push({
        time: "14:00",
        title: "Head to the airport",
        note: "Leave three hours before the gate closes",
        cost: Math.round(state.budget * 0.03),
        category: "travel",
      });
    } else {
      const slots = pace.start.slice(0, pace.perDay);
      slots.forEach((time, slot) => {
        const interest = interests[(index + slot) % interests.length];
        const template = BY_INTEREST[interest] ?? BY_INTEREST.Food;
        const isFreeSlot = slot === slots.length - 1 && dayNumber % 3 === 0;

        items.push(
          isFreeSlot
            ? {
                time,
                title: "Open block",
                note: "Wanderly keeps time free so the day can drift",
                cost: 0,
                category: "free",
              }
            : {
                time,
                title: `${template.title}, day ${dayNumber}`,
                note: template.note,
                cost: Math.round(perDayBudget / pace.perDay),
                category: template.category,
              },
        );
      });
    }

    return { label: `Day ${dayNumber} · ${dayTitle(dayNumber, state)}`, items };
  });

  const estimatedTotal = days.reduce(
    (total, day) => total + day.items.reduce((sum, item) => sum + item.cost, 0),
    0,
  );

  return {
    title: `${state.duration} days in ${state.destination}`,
    destination: state.destination,
    summary: `A ${state.style.toLowerCase()} ${state.duration}-day route built around ${interests
      .slice(0, 2)
      .join(" and ")
      .toLowerCase()}.`,
    estimatedTotal,
    days,
    packingSuggestions: [
      "Passport and printed visa",
      "Universal power adapter",
      "Comfortable walking shoes",
      "Light layer for evenings",
      "Reusable water bottle",
      "Offline maps downloaded",
      "Card plus a little local cash",
    ],
    source: "local",
  };
}

function dayTitle(dayNumber: number, state: PlannerState): string {
  if (dayNumber === 1) return "Arrival";
  if (dayNumber === state.duration && state.duration > 1) return "Fly home";
  const interests = state.interests.length ? state.interests : ["Food", "Nature"];
  return interests[(dayNumber - 2) % interests.length];
}

import {
  ASSISTANT_SYSTEM_PROMPT,
  coerceBudgetWidget,
  coercePackingWidget,
  extractBudgetAmount,
  extractLocationName,
  localAssistantReply,
  localBudgetWidget,
  trimHistory,
  wantsNearby,
  wantsPacking,
  wantsWeather,
} from "@/lib/assistant";
import { splitTrailingJsonBlock } from "@/lib/ai-json";
import { fetchNearbyPlaces } from "@/services/geo";
import { fetchWeatherFor } from "@/services/weather";
import { requestGroqCompletion, type GroqMessage } from "@/services/groq";
import type { AssistantWidget, ChatRequestBody, ChatResponseBody } from "@/types/assistant";

/**
 * POST /api/chat
 *
 * Runs on the server, so GROQ_API_KEY never reaches the browser.
 * Nearby-places and weather widgets are always built from real, free,
 * no-key APIs (Overpass / Open-Meteo) — never from the model, so they
 * can't be hallucinated. Budget and packing widgets come from the model
 * when a key is set, and from a deterministic local generator otherwise.
 */

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 800;

export async function POST(request: Request) {
  let input: Partial<ChatRequestBody>;

  try {
    input = (await request.json()) as Partial<ChatRequestBody>;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = String(input.message ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!message) {
    return Response.json({ error: "Message can't be empty." }, { status: 400 });
  }

  const history = trimHistory(Array.isArray(input.history) ? input.history : []);
  const location =
    input.location && Number.isFinite(input.location.lat) && Number.isFinite(input.location.lng)
      ? input.location
      : null;

  // Ground the two data-backed intents with real API calls, independent of
  // whether Groq is available — these never come from the model.
  let groundedWidget: AssistantWidget | null = null;
  let groundedContext = "";

  if (wantsNearby(message) && location) {
    const places = await fetchNearbyPlaces(location.lat, location.lng);
    if (places.length > 0) {
      groundedWidget = { kind: "nearby", places };
      groundedContext = `CONTEXT: Real nearby places (sorted by distance): ${places
        .map((p) => `${p.name} (${p.category}, ${p.distanceKm}km)`)
        .join("; ")}.`;
    }
  } else if (wantsWeather(message)) {
    const place = extractLocationName(message);
    if (place) {
      const weather = await fetchWeatherFor(place);
      if (weather) {
        groundedWidget = weather;
        groundedContext = `CONTEXT: Real current weather in ${weather.location} — ${weather.tempC}°C (feels like ${weather.feelsLikeC}°C), ${weather.condition}, wind ${weather.windKph}kph.`;
      }
    }
  }

  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return Response.json(localReply(message, groundedWidget, Boolean(location)));
  }

  try {
    const result = await modelReply(message, history, groundedContext, groundedWidget, key);
    return Response.json(result);
  } catch (error) {
    console.error("[chat] model call failed, using local responder:", error);
    return Response.json(localReply(message, groundedWidget, Boolean(location)));
  }
}

function localReply(
  message: string,
  groundedWidget: AssistantWidget | null,
  hadLocation: boolean,
): ChatResponseBody {
  if (groundedWidget) {
    const label = groundedWidget.kind === "weather" ? "the weather details above" : "what's nearby";
    return { reply: `Here's ${label} — let me know if you want more detail.`, widget: groundedWidget, source: "local" };
  }
  const { reply, widget } = localAssistantReply(message, hadLocation);
  return { reply, widget, source: "local" };
}

async function modelReply(
  message: string,
  history: { role: "user" | "assistant"; text: string }[],
  groundedContext: string,
  groundedWidget: AssistantWidget | null,
  key: string,
): Promise<ChatResponseBody> {
  const messages: GroqMessage[] = [{ role: "system", content: ASSISTANT_SYSTEM_PROMPT }];

  if (groundedContext) {
    messages.push({ role: "system", content: groundedContext });
  }

  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.text.slice(0, 800) });
  }

  messages.push({ role: "user", content: message });

  const text = await requestGroqCompletion({ apiKey: key, messages });
  const { prose, data } = splitTrailingJsonBlock(text);

  // Grounded widgets (real data) always win over anything the model tried to fabricate.
  if (groundedWidget) {
    return { reply: prose || text, widget: groundedWidget, source: "model" };
  }

  let widget: AssistantWidget | null = null;
  const parsed = (data ?? {}) as { kind?: string };

  if (parsed.kind === "budget") {
    widget = coerceBudgetWidget(data, extractBudgetAmount(message) ?? 20000);
  } else if (parsed.kind === "packing") {
    widget = coercePackingWidget(data);
  } else if (wantsPacking(message) && !data) {
    // Model answered packing in plain prose without the JSON block — that's fine,
    // just skip the widget rather than forcing one.
    widget = null;
  } else if (extractBudgetAmount(message) && !data) {
    widget = localBudgetWidget(extractBudgetAmount(message)!);
  }

  return { reply: prose || text, widget, source: "model" };
}

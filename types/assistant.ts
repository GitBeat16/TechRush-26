/**
 * Types for the AI travel assistant (chat) feature.
 * Shared between the client and /api/chat — keep this free of server-only
 * imports (env vars, fs, network clients).
 */

export type ChatRole = "user" | "assistant";

export interface ChatHistoryEntry {
  role: ChatRole;
  text: string;
}

export interface BudgetItem {
  label: string;
  amountLabel: string;
}

export interface BudgetBreakdownWidget {
  kind: "budget";
  totalLabel: string;
  items: BudgetItem[];
}

export interface PackingCategory {
  label: string;
  items: string[];
}

export interface PackingListWidget {
  kind: "packing";
  categories: PackingCategory[];
}

export interface NearbyPlace {
  name: string;
  category: string;
  distanceKm: number;
}

export interface NearbyPlacesWidget {
  kind: "nearby";
  places: NearbyPlace[];
}

export interface WeatherWidget {
  kind: "weather";
  location: string;
  tempC: number;
  feelsLikeC: number;
  condition: string;
  windKph: number;
}

export type AssistantWidget =
  | BudgetBreakdownWidget
  | PackingListWidget
  | NearbyPlacesWidget
  | WeatherWidget;

export interface ChatRequestBody {
  message: string;
  history?: ChatHistoryEntry[];
  location?: { lat: number; lng: number } | null;
}

export interface ChatResponseBody {
  reply: string;
  widget: AssistantWidget | null;
  /** "model" when Groq answered, "local" when the offline responder did. */
  source: "model" | "local";
}

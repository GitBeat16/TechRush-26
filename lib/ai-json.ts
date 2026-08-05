/**
 * Shared helper for pulling a JSON object out of a model's text reply.
 * Models routinely wrap JSON in prose, code fences, or both — this exists
 * so every route that talks to Groq validates output the same way.
 */

/** Finds the first fenced ```json block, or falls back to the first {...} span. */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return text.slice(start, end + 1);
}

/**
 * Splits a reply into its prose part and a trailing fenced JSON block, for
 * responses that are mostly natural language with one optional data block
 * at the end (the assistant chat's budget/packing widgets use this).
 * Returns `data: null` when there's no fenced block, rather than throwing —
 * most replies won't have one.
 */
export function splitTrailingJsonBlock(text: string): { prose: string; data: unknown | null } {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (!match) return { prose: text.trim(), data: null };

  const prose = text.slice(0, match.index).trim();
  try {
    return { prose, data: JSON.parse(match[1].trim()) };
  } catch {
    return { prose, data: null };
  }
}

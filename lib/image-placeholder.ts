/**
 * Deterministic inline SVG placeholders — used whenever a photo URL is missing
 * or fails to load, so the UI never shows a broken image icon.
 */

const CLAY_GRADIENTS: [string, string][] = [
  ["#f9b384", "#f7a8b8"],
  ["#bfe9d5", "#c3dcfb"],
  ["#dcd2fb", "#f9b384"],
  ["#fce3a8", "#f7a8b8"],
  ["#c3dcfb", "#dcd2fb"],
  ["#f7d6bd", "#bfe9d5"],
];

/** Stable, non-negative hash so the same seed always maps to the same colours. */
function hash(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value = (value * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(value);
}

/** A data-URL SVG gradient, sized for a 9:16 story frame by default. */
export function photoPlaceholder(seed = "wanderly", width = 720, height = 1280): string {
  const [from, to] = CLAY_GRADIENTS[hash(seed) % CLAY_GRADIENTS.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${width * 0.5}" cy="${height * 0.46}" r="${Math.min(width, height) * 0.11}" fill="rgba(255,255,255,0.35)"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Tiny blurred version, suitable for `next/image` blurDataURL props. */
export function blurPlaceholder(seed = "wanderly"): string {
  return photoPlaceholder(seed, 16, 28);
}

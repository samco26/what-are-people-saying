/* Server-only reads of the environment. Nothing in here is imported by
   browser code, and no key is ever returned to a route response: the route
   only asks whether a source is configured, never what its key is.

   Every value is optional. With nothing set the app answers the six example
   subjects from labelled samples and nothing else. */

export function env(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/* An integer setting with a default and a sensible range, so a typo in
   Vercel's settings cannot ask a source for ten thousand items. */
export function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = env(name);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const configured = {
  openai: () => Boolean(env("OPENAI_API_KEY")),
  youtube: () => Boolean(env("YOUTUBE_API_KEY")),
  x: () => Boolean(env("X_BEARER_TOKEN")),
  reddit: () => Boolean(env("REDDIT_CLIENT_ID") && env("REDDIT_CLIENT_SECRET")),
};

/* Live search is possible when the analysis key exists and at least one
   source can be read. */
export function liveEnabled(): boolean {
  return configured.openai() && (configured.youtube() || configured.x() || configured.reddit());
}

import type { ScoredItem } from "../domain/types.js";

export function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    url.search = "";
    return (url.host + url.pathname).replace(/\/$/, "").toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

// Keep highest-scored item per story; drop duplicate URL or title.
export function dedupe(items: ScoredItem[]): ScoredItem[] {
  const seen = new Set<string>();
  const out: ScoredItem[] = [];
  for (const it of items) {
    const u = normalizeUrl(it.url);
    const t = normalizeTitle(it.title);
    if (seen.has(u) || seen.has(t)) continue;
    seen.add(u);
    seen.add(t);
    out.push(it);
  }
  return out;
}

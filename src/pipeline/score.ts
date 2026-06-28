import type { RawItem, ScoredItem } from "../domain/types.js";

export function ageHours(publishedAt: string | null, now: Date): number | null {
  if (!publishedAt) return null;
  const t = new Date(publishedAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, (now.getTime() - t) / 3_600_000);
}

// Deterministic, explainable score. No AI, no network.
export function scoreItem(item: RawItem, now: Date): ScoredItem {
  const age = ageHours(item.publishedAt, now);
  let score = 0;
  if (age !== null) score += Math.max(0, 1 - age / 72) * 5; // recency, decays over 72h
  else score += 1;
  if (item.sourceKind === "primary") score += 2;            // prefer primary sources
  const len = item.title.length;
  if (len >= 30 && len <= 120) score += 1;                  // reasonable headline length
  return { ...item, score: round(score), ageHours: age };
}

export function scoreAll(items: RawItem[], now: Date): ScoredItem[] {
  return items.map((i) => scoreItem(i, now)).sort((a, b) => b.score - a.score);
}

function round(n: number): number { return Math.round(n * 100) / 100; }

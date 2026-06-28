import type { Brief, BriefMetrics } from "../domain/types.js";

export function computeMetrics(brief: Brief, now: Date = new Date()): BriefMetrics {
  const items = brief.items ?? [];
  const n = items.length;
  const primary = items.filter((i) => i.sourceKind === "primary").length;

  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.source, (counts.get(it.source) ?? 0) + 1);
  const maxPub = counts.size ? Math.max(...counts.values()) : 0;

  const ages = items
    .map((i) => (i.publishedAt ? (now.getTime() - new Date(i.publishedAt).getTime()) / 3_600_000 : null))
    .filter((x): x is number => x !== null && !Number.isNaN(x));
  const avgAge = ages.length ? round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;

  return {
    itemCount: n,
    primarySourceShare: n ? round(primary / n) : 0,
    publisherConcentration: n ? round(maxPub / n) : 0,
    topicDiversity: n ? round(counts.size / n) : 0,
    avgAgeHours: avgAge,
  };
}

function round(n: number): number { return Math.round(n * 100) / 100; }

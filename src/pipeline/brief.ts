import type { Source, Brief, ScoredItem } from "../domain/types.js";
import { fetchAll, type Fetcher } from "./fetch.js";
import { scoreAll } from "./score.js";
import { dedupe } from "./dedupe.js";

export interface BuildOptions {
  limit?: number;
  perSourceCap?: number; // max items kept per source, for topic diversity (<=0 disables)
  now?: Date;
  runId?: string;
  fetcher?: Fetcher;
}

// Orchestrates the deterministic pipeline. Network is injected, so this is testable offline.
export async function buildBrief(sources: Source[], opts: BuildOptions = {}): Promise<Brief> {
  const now = opts.now ?? new Date();
  const fetcher = opts.fetcher ?? (globalThis.fetch as unknown as Fetcher);
  const raw = await fetchAll(sources, fetcher);
  const ranked = capPerSource(dedupe(scoreAll(raw, now)), opts.perSourceCap ?? 2);
  const top = ranked.slice(0, opts.limit ?? 12);
  return {
    schemaVersion: 1,
    runId: opts.runId ?? `run-${now.toISOString()}`,
    date: now.toISOString().slice(0, 10),
    generatedAt: now.toISOString(),
    items: top.map((i) => ({
      title: i.title,
      url: i.url,
      source: i.sourceTitle,
      sourceKind: i.sourceKind,
      publishedAt: i.publishedAt,
      score: i.score,
    })),
  };
}

// Keep at most `cap` items per source, preserving score order so the highest-scored
// items from each source survive while no single source can flood the brief. A cap
// of 0 or less disables the limit. This is the deterministic diversity guard; finer
// per-item curation is the editorial (AI) step, see docs/editorial-policy.md.
function capPerSource(items: ScoredItem[], cap: number): ScoredItem[] {
  if (cap <= 0) return items;
  const counts = new Map<string, number>();
  const out: ScoredItem[] = [];
  for (const it of items) {
    const n = counts.get(it.sourceId) ?? 0;
    if (n >= cap) continue;
    counts.set(it.sourceId, n + 1);
    out.push(it);
  }
  return out;
}

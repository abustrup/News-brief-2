import type { Source, Brief } from "../domain/types.js";
import { fetchAll, type Fetcher } from "./fetch.js";
import { scoreAll } from "./score.js";
import { dedupe } from "./dedupe.js";

export interface BuildOptions {
  limit?: number;
  now?: Date;
  runId?: string;
  fetcher?: Fetcher;
}

// Orchestrates the deterministic pipeline. Network is injected, so this is testable offline.
export async function buildBrief(sources: Source[], opts: BuildOptions = {}): Promise<Brief> {
  const now = opts.now ?? new Date();
  const fetcher = opts.fetcher ?? (globalThis.fetch as unknown as Fetcher);
  const raw = await fetchAll(sources, fetcher);
  const ranked = dedupe(scoreAll(raw, now));
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

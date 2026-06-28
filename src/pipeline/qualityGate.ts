import type { Brief, QualityResult } from "../domain/types.js";

export interface GateOptions {
  minItems?: number;
  maxPerPublisher?: number;
}

// Deterministic, in-payload checks only. Blocking issues -> errors; soft issues -> warnings.
export function qualityGate(brief: Brief, opts: GateOptions = {}): QualityResult {
  const minItems = opts.minItems ?? 3;
  const maxPerPublisher = opts.maxPerPublisher ?? 3;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (brief.schemaVersion !== 1) errors.push("schema-version-unsupported");
  if (!Array.isArray(brief.items) || brief.items.length < minItems) errors.push("too-few-items");

  const urls = new Set<string>();
  for (const it of brief.items ?? []) {
    const u = it.url.toLowerCase();
    if (urls.has(u)) errors.push("duplicate-url");
    urls.add(u);
  }

  const counts = new Map<string, number>();
  for (const it of brief.items ?? []) counts.set(it.source, (counts.get(it.source) ?? 0) + 1);
  for (const [pub, n] of counts) {
    if (n > maxPerPublisher) warnings.push(`publisher-concentration:${pub}`);
  }

  if ((brief.items ?? []).some((i) => !i.publishedAt)) warnings.push("missing-published-date");

  return { ok: errors.length === 0, errors, warnings };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { qualityGate } from "../src/pipeline/qualityGate.js";
import type { Brief, BriefItem } from "../src/domain/types.js";

let seq = 0;
const item = (over: Partial<BriefItem> = {}): BriefItem => ({
  title: "headline", url: `https://e.com/${seq++}`, source: "S", sourceKind: "primary", publishedAt: "2025-01-01T00:00:00Z", score: 1, ...over,
});
const brief = (items: BriefItem[]): Brief => ({ schemaVersion: 1, runId: "r", date: "2025-01-01", generatedAt: "2025-01-01T00:00:00Z", items });

test("healthy brief passes with no errors", () => {
  const r = qualityGate(brief([item(), item(), item()]));
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test("too few items and duplicate url are blocking errors", () => {
  const dup = item({ url: "https://e.com/dup" });
  const r = qualityGate(brief([dup, { ...dup }]));
  assert.equal(r.ok, false);
  assert.ok(r.errors.includes("too-few-items"));
  assert.ok(r.errors.includes("duplicate-url"));
});

test("publisher concentration is a warning, not blocking", () => {
  const items = Array.from({ length: 5 }, () => item({ source: "OneSource" }));
  const r = qualityGate(brief(items), { minItems: 1, maxPerPublisher: 3 });
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => w.startsWith("publisher-concentration")));
});

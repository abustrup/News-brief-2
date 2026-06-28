import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupe, normalizeUrl } from "../src/pipeline/dedupe.js";
import type { ScoredItem } from "../src/domain/types.js";

test("normalizeUrl strips query, hash and trailing slash", () => {
  assert.equal(normalizeUrl("https://E.com/Path/?x=1#y"), "e.com/path");
});

test("dedupe drops duplicate url and duplicate title", () => {
  const base = { sourceId: "a", sourceTitle: "A", sourceKind: "primary" as const, publishedAt: "2025-01-01T00:00:00Z", score: 1, ageHours: 1 };
  const items: ScoredItem[] = [
    { ...base, title: "Same Story", url: "https://e.com/a" },
    { ...base, title: "Same Story", url: "https://e.com/b" },        // duplicate title
    { ...base, title: "Other", url: "https://e.com/a?utm=1" },       // duplicate url
    { ...base, title: "Unique", url: "https://e.com/c" },
  ];
  assert.equal(dedupe(items).length, 2);
});

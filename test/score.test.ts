import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreAll, ageHours } from "../src/pipeline/score.js";
import type { RawItem } from "../src/domain/types.js";

const now = new Date("2025-01-02T00:00:00Z");

test("ageHours computes hours and handles null", () => {
  assert.equal(ageHours("2025-01-01T00:00:00Z", now), 24);
  assert.equal(ageHours(null, now), null);
});

test("scoreAll prefers recent primary sources and sorts desc", () => {
  const items: RawItem[] = [
    { sourceId: "a", sourceTitle: "A", sourceKind: "secondary", title: "Old secondary item with a reasonable headline length", url: "https://e.com/1", publishedAt: "2024-12-01T00:00:00Z" },
    { sourceId: "b", sourceTitle: "B", sourceKind: "primary", title: "Fresh primary item with a reasonable headline length", url: "https://e.com/2", publishedAt: "2025-01-01T12:00:00Z" },
  ];
  const scored = scoreAll(items, now);
  assert.equal(scored[0].url, "https://e.com/2");
  assert.ok(scored[0].score > scored[1].score);
});

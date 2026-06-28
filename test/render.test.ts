import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBrief } from "../src/pipeline/render.js";
import type { Brief } from "../src/domain/types.js";

test("renderBrief is self-contained, no-referrer, escaped, scriptless", () => {
  const b: Brief = {
    schemaVersion: 1, runId: "r", date: "2025-01-01", generatedAt: "2025-01-01T00:00:00Z",
    items: [{ title: "A <b>title</b> & more", url: "https://e.com/a", source: "S", sourceKind: "primary", publishedAt: "2025-01-01T00:00:00Z", score: 1 }],
  };
  const html = renderBrief(b);
  assert.ok(html.includes('<meta name="referrer" content="no-referrer">'));
  assert.ok(html.includes("&lt;b&gt;"));
  assert.ok(html.includes("https://e.com/a"));
  assert.ok(!html.includes("<script"));
});

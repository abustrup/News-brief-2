import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBrief } from "../src/pipeline/brief.js";
import type { Source } from "../src/domain/types.js";

const sources: Source[] = [{ id: "x", title: "X Feed", url: "https://feed.example/rss", kind: "primary" }];
const RSS = `<rss><channel>
  <item><title>Alpha headline that is sufficiently long to score well</title><link>https://e.com/alpha</link><pubDate>Sat, 31 May 2025 12:00:00 GMT</pubDate></item>
  <item><title>Beta headline that is sufficiently long to score well</title><link>https://e.com/beta</link><pubDate>Sat, 31 May 2025 10:00:00 GMT</pubDate></item>
</channel></rss>`;

const fakeFetcher = async () => ({ ok: true, status: 200, text: async () => RSS });

test("buildBrief produces a schema-v1 brief offline via injected fetcher", async () => {
  const brief = await buildBrief(sources, { fetcher: fakeFetcher, now: new Date("2025-06-01T00:00:00Z"), runId: "test-run" });
  assert.equal(brief.schemaVersion, 1);
  assert.equal(brief.runId, "test-run");
  assert.equal(brief.date, "2025-06-01");
  assert.equal(brief.items.length, 2);
  assert.equal(brief.items[0].sourceKind, "primary");
});

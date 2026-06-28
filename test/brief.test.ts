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

// One source flooding the feed must not crowd out others: the per-source cap keeps
// the brief diverse. Source A offers 5 fresh items, B offers 3; cap=2 keeps 2 each.
const feed = (prefix: string, n: number): string =>
  `<rss><channel>${Array.from({ length: n }, (_, i) =>
    `<item><title>${prefix} headline number ${i} that is sufficiently long to score</title><link>https://e.com/${prefix}${i}</link><pubDate>Sat, 31 May 2025 12:00:00 GMT</pubDate></item>`
  ).join("")}</channel></rss>`;

const multiSources: Source[] = [
  { id: "a", title: "A Feed", url: "https://a/rss", kind: "primary" },
  { id: "b", title: "B Feed", url: "https://b/rss", kind: "primary" },
];
const multiFetcher = async (url: string) => ({
  ok: true,
  status: 200,
  text: async () => feed(url.includes("//a/") ? "Alpha" : "Beta", url.includes("//a/") ? 5 : 3),
});

test("buildBrief caps items per source so one feed cannot flood the brief", async () => {
  const brief = await buildBrief(multiSources, { fetcher: multiFetcher, now: new Date("2025-06-01T00:00:00Z"), perSourceCap: 2 });
  const counts = new Map<string, number>();
  for (const it of brief.items) counts.set(it.source, (counts.get(it.source) ?? 0) + 1);
  assert.ok([...counts.values()].every((n) => n <= 2), "no source exceeds the cap of 2");
  assert.equal(brief.items.length, 4); // 2 from A + 2 from B
});

test("perSourceCap=0 disables the cap", async () => {
  const brief = await buildBrief(multiSources, { fetcher: multiFetcher, now: new Date("2025-06-01T00:00:00Z"), perSourceCap: 0 });
  assert.equal(brief.items.length, 8); // all 5 + 3 survive
});

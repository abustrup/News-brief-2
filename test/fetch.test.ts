import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFeed } from "../src/pipeline/fetch.js";
import type { Source } from "../src/domain/types.js";

const SRC: Source = { id: "x", title: "X", url: "https://x/rss", kind: "primary" };

test("parseFeed reads RSS items, CDATA and entities", () => {
  const xml = `<rss><channel>
    <item><title>Hello World</title><link>https://e.com/a</link><pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate></item>
    <item><title><![CDATA[Second & Third]]></title><link>https://e.com/b</link></item>
  </channel></rss>`;
  const items = parseFeed(xml, SRC);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Hello World");
  assert.equal(items[1].title, "Second & Third");
  assert.equal(items[0].url, "https://e.com/a");
  assert.ok(items[0].publishedAt?.startsWith("2025-01-01"));
});

test("parseFeed reads Atom entries with link href", () => {
  const xml = `<feed><entry><title>Atom Item</title><link href="https://e.com/c"/><updated>2025-01-01T00:00:00Z</updated></entry></feed>`;
  const items = parseFeed(xml, SRC);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://e.com/c");
});

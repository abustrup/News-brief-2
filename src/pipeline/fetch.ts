import type { Source, RawItem } from "../domain/types.js";

// Minimal fetcher contract so the pipeline stays testable offline.
export type FetchResponse = { ok: boolean; status: number; text: () => Promise<string> };
export type Fetcher = (url: string, init?: unknown) => Promise<FetchResponse>;

// Mirror a real browser request (UA + Accept), but send no Referer.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; NewsBriefBot/1.0; +https://github.com/)",
  Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
};

export async function fetchSource(source: Source, fetcher: Fetcher): Promise<RawItem[]> {
  const res = await fetcher(source.url, { headers: HEADERS });
  if (!res.ok) return [];
  return parseFeed(await res.text(), source);
}

export async function fetchAll(sources: Source[], fetcher: Fetcher): Promise<RawItem[]> {
  const batches = await Promise.all(sources.map((s) => fetchSource(s, fetcher).catch(() => [])));
  return batches.flat();
}

// Tiny RSS/Atom parser — no external dependency.
export function parseFeed(xml: string, source: Source): RawItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const out: RawItem[] = [];
  for (const block of blocks) {
    const title = decode(tag(block, "title"));
    const url = decode(tag(block, "link")) || attr(block, "link", "href");
    const pub = tag(block, "pubDate") || tag(block, "updated") || tag(block, "published");
    if (!title || !url) continue;
    out.push({
      sourceId: source.id,
      sourceTitle: source.title,
      sourceKind: source.kind,
      title,
      url,
      publishedAt: toIso(pub),
    });
  }
  return out;
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? cdata(m[1]).trim() : "";
}
function attr(block: string, name: string, a: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*\\s${a}="([^"]+)"`, "i"));
  return m ? m[1].trim() : "";
}
function cdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}
function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'");
}
function toIso(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

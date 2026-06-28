import type { Brief, BriefItem } from "../domain/types.js";

// Self-contained HTML: inline CSS, no scripts, images (if any) get no-referrer.
export function renderBrief(brief: Brief): string {
  const items = brief.items.map(renderItem).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>News Brief — ${esc(brief.date)}</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 16px/1.6 -apple-system, system-ui, "Segoe UI", sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.4rem; margin-bottom: .25rem; }
  .meta { color: #777; font-size: .85rem; margin-bottom: 1.5rem; }
  .item { padding: .7rem 0; border-bottom: 1px solid rgba(128,128,128,.25); }
  .item a { font-weight: 600; text-decoration: none; }
  .item a:hover { text-decoration: underline; }
  .src { color: #777; font-size: .8rem; margin-top: .15rem; }
</style>
</head>
<body>
<h1>News Brief — ${esc(brief.date)}</h1>
<div class="meta">${brief.items.length} items · generated ${esc(brief.generatedAt)} · run ${esc(brief.runId)}</div>
${items}
</body>
</html>`;
}

function renderItem(it: BriefItem): string {
  const date = it.publishedAt ? " · " + esc(it.publishedAt.slice(0, 10)) : "";
  return `<div class="item"><a href="${escAttr(it.url)}" rel="noreferrer">${esc(it.title)}</a><div class="src">${esc(it.source)}${date}</div></div>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(s: string): string {
  return esc(s).replace(/"/g, "&quot;");
}

import { readFileSync } from "node:fs";
import type { Brief } from "../domain/types.js";

const path = process.argv[2] ?? "data/draft.json";
const brief = JSON.parse(readFileSync(path, "utf8")) as Brief;

const errors: string[] = [];
if (brief.schemaVersion !== 1) errors.push("schema-version");
if (!brief.runId) errors.push("missing-runId");
if (!/^\d{4}-\d{2}-\d{2}$/.test(brief.date ?? "")) errors.push("bad-date");
if (!Array.isArray(brief.items) || brief.items.length === 0) errors.push("no-items");
(brief.items ?? []).forEach((it, i) => {
  if (!it.title) errors.push(`item-${i}-title`);
  if (!it.url || !/^https?:\/\//.test(it.url)) errors.push(`item-${i}-url`);
});

console.log(JSON.stringify({ valid: errors.length === 0, errors }, null, 2));
process.exit(errors.length === 0 ? 0 : 1);

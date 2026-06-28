import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildBrief } from "../pipeline/brief.js";
import type { Source } from "../domain/types.js";

const sources: Source[] = JSON.parse(
  readFileSync(new URL("../config/sources.json", import.meta.url), "utf8")
);

const brief = await buildBrief(sources);
mkdirSync("data/briefs", { recursive: true });
writeFileSync("data/draft.json", JSON.stringify(brief, null, 2));
console.log(`Built brief ${brief.date}: ${brief.items.length} items -> data/draft.json`);

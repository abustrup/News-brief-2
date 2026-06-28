import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Brief } from "../domain/types.js";
import { renderBrief } from "../pipeline/render.js";

const inPath = process.argv[2] ?? "data/draft.json";
const outPath = process.argv[3] ?? "docs/index.html";
const brief = JSON.parse(readFileSync(inPath, "utf8")) as Brief;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, renderBrief(brief));
console.log(`Rendered ${brief.items.length} items -> ${outPath}`);

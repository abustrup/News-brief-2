import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Brief } from "../domain/types.js";
import { computeMetrics } from "../pipeline/metrics.js";

const inPath = process.argv[2] ?? "data/draft.json";
const outPath = process.argv[3];
const brief = JSON.parse(readFileSync(inPath, "utf8")) as Brief;
const metrics = computeMetrics(brief);

if (outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(metrics, null, 2));
}
console.log(JSON.stringify(metrics, null, 2));

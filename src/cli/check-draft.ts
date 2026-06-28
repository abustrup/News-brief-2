import { readFileSync } from "node:fs";
import type { Brief } from "../domain/types.js";
import { qualityGate } from "../pipeline/qualityGate.js";

const path = process.argv[2] ?? "data/draft.json";
const brief = JSON.parse(readFileSync(path, "utf8")) as Brief;
const result = qualityGate(brief);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);

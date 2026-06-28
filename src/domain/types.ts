// Domain schema. schemaVersion is frozen at 1 — additive changes only.
export type SourceKind = "primary" | "secondary";

export interface Source {
  id: string;
  title: string;
  url: string;
  kind: SourceKind;
}

export interface RawItem {
  sourceId: string;
  sourceTitle: string;
  sourceKind: SourceKind;
  title: string;
  url: string;
  publishedAt: string | null; // ISO 8601
}

export interface ScoredItem extends RawItem {
  score: number;
  ageHours: number | null;
}

export interface BriefItem {
  title: string;
  url: string;
  source: string;
  sourceKind: SourceKind;
  publishedAt: string | null;
  score: number;
}

export interface Brief {
  schemaVersion: 1;
  runId: string;
  date: string;        // YYYY-MM-DD
  generatedAt: string; // ISO 8601
  items: BriefItem[];
}

export interface QualityResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface BriefMetrics {
  itemCount: number;
  primarySourceShare: number;
  publisherConcentration: number;
  topicDiversity: number;
  avgAgeHours: number | null;
}

# Editorial policy — Daily News Brief

This is the **AI step**: the judgment Claude applies on the Max subscription during the
daily Cowork run, on top of the deterministic pipeline. The code in `src/` only *fetches,
scores, de-duplicates, validates, gates, and renders* — it makes **no editorial choices**.
Everything that requires judgment lives here.

> **Status: v1 draft for review.** Tune the beats, weights, and tone below to taste.
> Nothing here changes the schema (`schemaVersion: 1`) or the code contract.

---

## 1. Purpose & audience

A concise morning brief for a reader who tracks **world events, business & finance, and
technology** and wants the day's signal without the noise. Default to facts a decision-maker
would act on; skip outrage-bait, gossip, and pure entertainment.

## 2. Beats to prioritize

In rough order of value:

1. **Macro / markets / finance** — rates, inflation, major moves, central-bank and regulatory
   action, significant earnings, trade & tariffs.
2. **World news of consequence** — geopolitics, conflict, elections, policy with cross-border
   impact.
3. **Technology that matters** — AI, semiconductors, major platform/product shifts, security
   incidents, notable funding/M&A.
4. **Science & energy** — material breakthroughs, climate/energy policy and supply.

## 3. Beats to avoid or downweight

- Celebrity, lifestyle, sports scores, royal-family color, and listicles.
- Single-outlet rumor with no corroboration.
- Pure opinion/op-ed unless it adds material analysis to a real event.
- Stories already stale (the score decays over ~72h — let it; don't resurface old items).

## 4. Source-quality rules

- **Primary vs secondary** is encoded in `sources.json` (`kind`). The scorer already gives
  primary sources a bonus; respect that. Treat wire/established-publisher reporting as primary,
  aggregators/blogs (HN, tech blogs) as secondary signal.
- Prefer the **original reporting** over an aggregator re-post of the same story.
- If a story appears from several sources, keep the **highest-quality primary** version (the
  dedupe step keeps the highest-scored; nudge ties toward the primary outlet).

## 5. Portfolio rules (the shape of the brief)

- **Length:** ~8–12 items. Quality over volume; a thin-but-true day is fine.
- **Publisher concentration:** aim for **≤ 3 items per publisher** (the quality gate *warns*
  above this). Spread across outlets so no single feed dominates the page.
- **Topic mix:** don't let one beat (e.g. a single big tech story) crowd out world/finance.
  Target rough balance: ~40% business/finance, ~35% world, ~25% tech/science — adjust to the day.
- **Primary share:** prefer a brief where a healthy majority of items are primary sources.

## 6. Tone, length, language

- **Language:** English. (Note: feeds and parser are language-agnostic — if you add
  non-English sources later, set the brief language here.)
- **Headlines:** use the source's own headline as-is; the renderer escapes and links it. Do
  **not** editorialize the headline.
- **Any written summary you add** (if you extend the brief beyond headline+link): neutral,
  factual, one or two sentences, no hype, no clickbait, no emoji.

## 7. Judgment calls (human-in-the-loop intent)

- When two stories are near-duplicates across beats, keep the one with broader consequence.
- Drop anything you can't stand behind factually — **when in doubt, leave it out.**
- Never publish a brief that fails the quality gate (`npm run check:draft`). If the gate
  errors, stop and report; do not hand-edit around it.

## 8. Hard guardrails (non-negotiable)

- **No paid APIs / no `ANTHROPIC_API_KEY`** — this runs on the Max subscription.
- **No secrets in the repo.** Sources are public RSS only; if a future source needs a key,
  document it and keep it optional.
- **Publish only when every check is green.** The gate is the backstop, not a suggestion.

# Daily News Brief — Cowork scheduled-task prompt

Paste this as the instruction when creating the scheduled task (e.g. daily 06:30).
It runs entirely on the Claude Max subscription. **Do NOT set ANTHROPIC_API_KEY** —
that would switch to paid per-token API billing instead of your subscription.

---

Open the `news-brief` project folder and run `git pull`.

Build today's candidate pool (deterministic fetch + score + dedupe):

    npm run brief:build        # writes data/draft.json

Then produce today's brief by **curating `data/draft.json`** following
`docs/editorial-policy.md` — drop/reorder/balance items so the mix matches the
policy. This editorial selection/curation is the AI step, performed here on the
Max subscription. `publish-pages.sh` will publish exactly this file; it does NOT
re-build, so your curation is preserved.

Then run the safety chain and publish ONLY if everything is green:

    bash scripts/publish-pages.sh

If `npm run verify`, `validate:draft`, or `check:draft` fails, or the quality gate
reports any errors, DO NOT publish. Stop and report exactly what failed.

When done, confirm the live page loads at:
    https://abustrup.github.io/News-brief-2/

Guardrails:
- Never publish a brief that fails the quality gate.
- Keep everything inside this repo — no external services or hidden config.

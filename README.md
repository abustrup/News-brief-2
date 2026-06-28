# News Brief

A self-contained daily news-brief pipeline. It fetches sources, scores and de-duplicates them with deterministic (no-AI) code, runs a quality gate, renders a self-contained HTML page, and keeps a versioned history — all inside this one folder.

It is designed to run on your **Claude Max subscription** via a Cowork scheduled task. **No paid APIs, no external services, no hidden dependencies.**

---

## Dependencies (explicit)

Everything needed to *run* the pipeline travels with this repo. The full list:

- ✅ **Node.js ≥ 20** — the only thing you install locally. Dev tools (`typescript`, `tsx`) come from `package.json` via `npm install`; nothing is global or hidden.
- ✅ **Claude Max subscription** — powers the daily run + the editorial step, via a Cowork scheduled task. No API key is used, so there are **no per-token charges**.
- ✅ **A free GitHub account** — for code history and free **GitHub Pages** hosting. The *only* external account, and it's free.
- ❌ **Deliberately NOT used (would cost extra):** an Anthropic **API key** (pay-per-token, not covered by Max), Cloudflare/Vercel/Netlify, any database, Google Apps Script / Sheets.
- ⚠️ **Check your sources:** the feeds in `src/config/sources.json` are public RSS (no key). If you swap in a source that needs a paid API key, that becomes a new dependency — keep it optional and documented here.
- ⚠️ **Trade-off:** the Cowork scheduled task runs on your Mac, so the machine must be awake at run time. (Going fully headless would require the paid API — see `docs/architecture-proposal.md`.)

---

## Quickstart

```bash
npm install        # pull dev tools declared in package.json
npm run verify     # typecheck + run all tests (offline, deterministic)
npm run brief:build    # fetch + score + dedupe -> data/draft.json
npm run check:draft    # quality gate (exits non-zero on errors)
npm run render         # -> docs/index.html (the page Pages serves)
```

Open `docs/index.html` in a browser to preview the brief.

---

## One-time setup (~20 min, once)

1. **Create a free GitHub repo** (use **public** — Pages on a private repo needs a paid plan) and push this folder:
   ```bash
   git remote add origin https://github.com/<you>/news-brief.git
   git push -u origin main
   ```
   *(Or, with the GitHub CLI: `gh repo create news-brief --private --source=. --push`.)*
   This is the one step that needs your GitHub login — an agent can't do the OAuth for you.
2. **Enable GitHub Pages:** repo **Settings → Pages → Source = Deploy from a branch → branch `main`, folder `/docs`.** Your brief will be live at `https://<you>.github.io/news-brief/`.
3. **Git auth for unattended pushes:** run `gh auth login` once (or configure a credential helper / fine-grained PAT) so the daily task can `git push` without prompts.
4. **Create the Cowork scheduled task** using the prompt in [`cowork/daily-task.md`](cowork/daily-task.md).

That's the entire human-in-the-loop footprint. After this, the brief publishes itself.

---

## Daily run (how it works)

The scheduled task (on Max) each morning: `git pull` → `npm run brief:build` (deterministic candidate pool → `data/draft.json`) → **curate `data/draft.json`** per `docs/editorial-policy.md` (the AI step) → `bash scripts/publish-pages.sh`. The publish script runs `verify → validate:draft → check:draft → metrics:brief → render`, then commits the HTML + JSON and pushes. It **does not re-build**, so the editorial curation is never clobbered, and it **publishes only if every check is green**; GitHub Pages then auto-deploys.

---

## Project layout

```
news-brief/
├─ src/
│  ├─ domain/types.ts        # frozen schema (schemaVersion: 1)
│  ├─ pipeline/              # fetch · score · dedupe · qualityGate · metrics · render · brief
│  └─ cli/                   # build-brief · validate-draft · check-draft · metrics-brief · render-brief
├─ test/                     # offline, deterministic tests (node:test)
├─ scripts/publish-pages.sh  # the publish step (replaces the old GAS deploy)
├─ cowork/daily-task.md      # the scheduled-task prompt (runs on Max)
├─ config → src/config/sources.json   # feeds (public RSS, no API key)
├─ data/briefs/ , data/metrics/        # git-as-data history (versioned, diffable)
├─ docs/index.html           # the published page (GitHub Pages serves /docs)
├─ docs/architecture-proposal.md       # why this design
└─ docs/editorial-policy.md  # YOUR AI step — plug your prompt/policy in here
```

---

## Bringing your existing project over

The deterministic core here is a clean, working baseline. To migrate your current system in:

- Drop your editorial **prompt / policy** into `docs/editorial-policy.md`.
- If you have a richer scoring / dedupe / quality-gate implementation, replace the matching files in `src/pipeline/` — the schema in `src/domain/types.ts` is the contract to keep stable.
- Point `src/config/sources.json` at your real sources.

Connect the project folder in Cowork and I can port your real `src/` and tests into this structure directly.

---

## Deliberately excluded (so it stays simple)

No GitHub Actions cron (a cloud cron would need the paid API for the editorial step), no Cloudflare/Vercel, no database (git is the datastore), no Apps Script / Sheets. The smallest thing that meets the goal: **Max + a free GitHub repo.**

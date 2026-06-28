# Handoff brief for Claude Code

You are taking over a **self-contained news-brief project** (folder `news-brief/`, also delivered as `news-brief-project.zip`). It is already built, typechecked, and tested (11 passing). Your job is to wire it up to run daily on **GitHub Pages**, on the user's **Claude Max** subscription, with **no paid APIs**.

## Hard constraints
- **Do NOT set `ANTHROPIC_API_KEY`.** It must run on the Max subscription, not paid per-token API.
- **No paid services.** Only Node + a free GitHub account. No Cloudflare/Vercel, no database, no Apps Script/Sheets.
- **Never commit secrets.** Keep everything inside the repo.
- Keep `src/domain/types.ts` (`schemaVersion: 1`) as the stable contract.

## Steps
1. **Verify locally**
   ```bash
   cd news-brief
   npm install
   npm run verify          # typecheck + tests, must be green
   ```
2. **Create the GitHub repo and push** — use a **public** repo (Pages on a *private* repo needs a paid plan; public keeps it free). Confirm the account with the user first.
   ```bash
   gh repo create news-brief --public --source=. --push
   # or: git remote add origin https://github.com/<you>/news-brief.git && git push -u origin main
   ```
3. **Enable GitHub Pages**: repo Settings → Pages → Source = Deploy from a branch → **branch `main`, folder `/docs`**. Confirm the URL `https://<you>.github.io/news-brief/`.
4. **Ensure unattended git auth** so the daily task can push: `gh auth login` (or a credential helper / fine-grained PAT).
5. **Make it real**
   - Point `src/config/sources.json` at the user's actual sources.
   - Put the user's editorial prompt/policy into `docs/editorial-policy.md`.
   - **If migrating the user's existing system:** replace `src/pipeline/{score,dedupe,qualityGate}.ts` with their richer implementations, bring their tests across, keep the schema stable, then `npm run verify`.
6. **Live dry run** (no publish needed yet)
   ```bash
   npm run brief:build && npm run validate:draft -- data/draft.json && npm run check:draft -- data/draft.json
   npm run render -- data/draft.json docs/index.html   # review the page
   ```
7. **First publish** (only when checks are green)
   ```bash
   bash scripts/publish-pages.sh
   ```
8. **Hand back**: report the live Pages URL and confirm `data/briefs/` + `data/metrics/` are being written.

## Leave to the Cowork side (not Claude Code)
Creating the **daily scheduled task** that runs `scripts/publish-pages.sh` on the Max subscription — that's a Cowork feature. The prompt for it is in `cowork/daily-task.md`. Once the repo is live, the Cowork agent will create it.

## Acceptance
- `npm run verify` green; repo on GitHub; Pages live.
- A manual `publish:pages` run produces a real page and commits the JSON history.
- No API key set anywhere; no paid service introduced.

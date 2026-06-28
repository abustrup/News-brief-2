# Architecture Proposal: A Multi-Agent, Self-Driving News-Brief Pipeline

**Decision:** Should the project stay on Google Apps Script (GAS)?
**Verdict:** Keep GAS *only* as an optional render/view target. Move the **control plane** — schedule, compute, deploy, and storage — off GAS to a git-centric, token-authenticated stack. GAS was the right zero-ops choice for a solo, human-driven start; it is the wrong substrate for "many agents + full autonomy + no human bottleneck."

---

## 1. Why your goals have outgrown Apps Script

Your three stated goals are, in engineering terms, three hard constraints:

| Your goal | What it actually requires |
|---|---|
| Multiple agents change the project | Git as single source of truth + automated CI guardrails so unsupervised commits can't break prod |
| Eliminate human-in-the-loop | Token-based deploy, cloud cron, token-based data access — **no interactive OAuth anywhere** |
| Routine daily task, reliably | A scheduler that runs without your machine being on, with retries + alerting |

Apps Script fails the first two at the root:

- **Deploy is OAuth-bound.** Even automated via `clasp`, deploying needs a Google login token that expires and periodically demands browser re-consent. That is a recurring human-in-the-loop step by design — exactly the bottleneck you hit when the deployed bundle went stale.
- **The GAS seam isn't locally testable.** Your TypeScript core (schemas, scoring, dedupe, quality gate, 220+ tests) is clean and offline. But `doGet`/`SpreadsheetApp` code only runs inside Google's cloud, so agents can't fully test the server layer before shipping — the riskiest part is the least guard-railed.
- **Runtime is constrained.** 6-minute execution cap, URL-fetch quotas, no npm at runtime, weak concurrency/retry, thin observability. Your earlier image false-positives (no browser User-Agent on `fetch`) are a symptom of this limited environment.
- **Sheets-as-database** is fine as a human-viewable log, but has weak locking/concurrency and couples your datastore to a UI artifact — awkward when many agents write.

**Steelman (where GAS still wins):** zero infra, zero cost, lives in your Google account, free stable web-app URL, built-in time triggers, and a Sheet humans can eyeball. If this were a personal, human-operated brief, GAS would still be the pragmatic choice. It isn't anymore.

---

## 2. Design principles (these matter more than the vendor)

1. **Git is the single source of truth.** Every change — code, config, prompts, editorial policy — is a commit. This is the coordination primitive that lets N agents work in parallel.
2. **CI is the guardrail, not a human.** Required checks (typecheck, full test suite, build, schema validation, the pre-publish gate, lint) gate every merge. Agents can commit freely; nothing red reaches prod.
3. **Every external action is token-authenticated and runs in the cloud.** Deploy, schedule, fetch, store — all via service tokens in CI secrets. No browser OAuth on the critical path.
4. **The pure core stays pure.** Keep the offline/deterministic editorial core and its tests untouched; only the thin I/O adapters change. This is what makes parallel-agent work safe and is why the migration is low-risk.

---

## 3. Recommended architecture

**Stack: GitHub (source of truth) + GitHub Actions (CI + cron) + Cloudflare Pages (public brief) + git-as-data (JSON history). Sheets demoted to an optional write-through view.**

```
Agents ──PRs──▶ GitHub repo ──required CI checks──▶ auto-merge to main
                     │
        (1) scheduled workflow (daily cron)
                     ▼
   build ▶ fetch sources ▶ score/dedupe ▶ quality gate ▶ prepublish checks ▶ render HTML
                     │                                            │
        (2) deploy static brief                    (3) commit brief.json + metrics.json
            via wrangler + API token                    to data branch (versioned history)
                     ▼                                            ▼
        Cloudflare Pages (stable URL, CDN)         git history = audit + rollback
                     │
        on failure / gate-suspend ▶ alert (issue / webhook) — the only human touchpoint
```

**What runs where**
- **Compute & schedule:** the existing CLIs (`build` → `validate:draft` → `check:draft` → `publish`) run unchanged in a scheduled GitHub Actions workflow. No rewrite of the editorial core.
- **Publish/render:** the renderer is already self-contained HTML, so it deploys to Cloudflare Pages with `wrangler` using `CLOUDFLARE_API_TOKEN` (a secret) — token-based, no OAuth, stable URL, global CDN. ([Cloudflare wrangler-action](https://github.com/cloudflare/wrangler-action))
- **Storage:** commit `brief.json` + `metrics.json` to a `data` branch. You get free versioned history, diffs, rollback, and agent-readable state with zero infra. Keep Sheets only if you want the spreadsheet view (write-through via the Sheets API + a **service account** — headless, no OAuth).

**Scheduler nuance (verified, current):** GitHub Actions cron is convenient but **not punctual** — 10–30 min delays are common under load (worse in early 2026), and scheduled workflows are **auto-disabled after 60 days of repo inactivity**. ([GitHub community](https://github.com/orgs/community/discussions/156282), [oneuptime](https://oneuptime.com/blog/post/2025-12-20-scheduled-workflows-cron-github-actions/view)) For a daily brief a few minutes' slack is fine; an active repo never hits the 60-day rule. If you need punctual timing, use a **Cloudflare Worker Cron Trigger** (more reliable, ~15 min max to propagate *config* changes, not per-run) to `workflow_dispatch` the Actions pipeline. ([Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/))

---

## 4. Platform comparison

| | **GAS (today)** | **GitHub + Cloudflare (recommended)** | **Vercel (alt)** | **VPS/container (alt)** |
|---|---|---|---|---|
| Deploy auth | OAuth (human) | **API token** | Git-push / token | SSH/token |
| Cron | Built-in triggers | Actions cron (delay-prone) or Workers cron (punctual) | Hobby = **1×/day only**, fires anywhere in the hour ([Vercel docs](https://vercel.com/docs/cron-jobs/usage-and-pricing)) | Native `cron` |
| Multi-agent fit | Poor (cloud-only truth) | **Excellent (git + CI)** | Good | Good |
| Local testing of I/O seam | No | **Yes** | Yes | Yes |
| Observability | Thin | CI logs + artifacts + alerts | Good | DIY |
| Ops burden | None | Very low | Low | **High** |
| Cost at your scale | Free | Effectively free | Free (Hobby) | $ monthly |

Vercel is a fine alternative if you later want a richer web app, but Hobby cron granularity (daily, coarse timing) and heavier vendor coupling make Cloudflare the better fit for a static brief. A VPS gives the most control but reintroduces ops/human toil — against your goal.

---

## 5. How many agents work safely (the multi-agent layer)

- **Branch protection + required status checks**: an agent's PR can only merge when typecheck, tests, build, schema validation, and the pre-publish gate are green.
- **Auto-merge on green**: removes the human approval bottleneck entirely. (Optional: require human review only on a small set of sensitive paths via CODEOWNERS — but your stated goal is zero human-in-loop, so default to auto-merge.)
- **Determinism is the safety net**: keep the existing offline/deterministic test rule — it's precisely what lets parallel agents not corrupt each other's state.
- **Serialized deploy**: a concurrency group ensures only one publish runs at a time; the quality gate (already built) auto-suspends non-compliant briefs.
- **Auditability**: every brief + metric is a commit; any agent (or you) can diff/rollback.

---

## 6. Phased migration (each phase ships independently; core + tests untouched)

- **Phase 0 — interim, optional (½ day):** add `clasp` + an Actions workflow so the *current* GAS deploy stops being manual. Removes the immediate stale-bundle bottleneck while you migrate. (Still OAuth-token-bound — a bridge, not the destination.)
- **Phase 1 — move the scheduler into the cloud (½–1 day):** run the existing CLIs in a scheduled GitHub Actions workflow. **Biggest autonomy win, smallest change** — kills the "runs on my laptop" dependency immediately.
- **Phase 2 — move publish/render to Cloudflare Pages (1 day):** deploy the self-contained HTML via `wrangler` + API token. Retire the GAS web app (or keep it as a fallback). **OAuth leaves the critical path here.**
- **Phase 3 — move storage to git-as-data (½–1 day):** commit `brief.json`/`metrics.json` to a data branch; demote Sheets to an optional service-account write-through view, or drop it.
- **Phase 4 — multi-agent guardrails (½ day):** branch protection, required checks, auto-merge, failure alerting, deploy concurrency group.

Total: roughly **3–4 focused days**, fully incremental, with the editorial core and its 220+ tests carried over unchanged at every step.

---

## 7. Residual human-in-the-loop (minimized and honest)

- **One-time setup (~30–45 min, once):** create the Cloudflare API token + any source API keys, add them to GitHub Actions secrets, enable branch protection. After this, nothing recurring.
- **Exception-only:** when CI fails or the gate auto-suspends a brief, someone investigates. Routine days require **zero** human action. (Even this can be handed to a watchdog agent that triages the failure issue.)
- **Editorial policy decisions** remain human judgment calls — but *implementing* them is agent work via normal PRs.

This is a strict improvement over GAS, where the recurring OAuth re-consent was an unavoidable, scheduled human task.

---

## 8. Risks & trade-offs (stated plainly)

- **Vendor coupling.** You trade GAS's zero-ops for Cloudflare + GitHub. Mitigation: static HTML is fully portable; the pipeline is plain Node; nothing is hard-locked.
- **Cron precision.** Actions cron can drift 10–30 min. Mitigation: accept the slack for a daily brief, or trigger via a Workers Cron for punctuality.
- **Secret management.** More tokens to hold. Mitigation: least-privilege scoped tokens in CI secrets with rotation — and it's *safer* than a long-lived OAuth refresh token sitting on a desktop.
- **Concurrent git writes** to the data branch. Mitigation: a single daily run + a concurrency group; conflicts are effectively impossible at this cadence.
- **Cost.** Negligible: Actions minutes are free on public repos (cheap on private), Cloudflare Pages free tier easily covers a daily static brief.

---

## 9. Bottom line

Apps Script is no longer the right control plane for what you want. Make **git the source of truth, CI the guardrail, and every external action token-based and cloud-scheduled.** Recommended stack: **GitHub + GitHub Actions + Cloudflare Pages + git-as-data**, migrated in four incremental phases that never touch your proven editorial core. The result: any number of agents can ship changes through automated checks, the brief publishes itself daily, and the only human steps left are a one-time setup and rare exception handling.

**Suggested first move:** Phase 1 (scheduler → GitHub Actions). It's the smallest change with the largest autonomy payoff and is reversible.

---

## 10. Enterprise variant: building this inside EIFO (regulated state finance)

**Context:** EIFO is the Export and Investment Fund of Denmark — Denmark's combined national promotional bank and export credit agency (a 2023 merger of Vækstfonden, EKF, and Danmarks Grønne Investeringsfond). That makes it a **state-owned, regulated financial entity**. The *principles* of this proposal still hold; the *vendors* and the *autonomy model* must bend to compliance.

**Carries over unchanged:** git as source of truth, CI as the guardrail, infrastructure-as-code, machine identity instead of personal OAuth, no manual toil.
**What changes:** which cloud, and how far autonomy reaches into production.

### Why it changes

1. **Regulation (DORA).** The EU Digital Operational Resilience Act has applied to ~22,000 EU financial entities since 17 Jan 2025, and EIFO is in scope. It requires a register of all ICT third-party providers, audit/exit rights + SLAs in every vendor contract, and concentration-risk review before adoption. In Nov 2025 the EU designated AWS and Microsoft Azure (among 19) as *critical* ICT providers. Effect: you can't just pick Cloudflare Pages or Vercel — third-party tooling goes through vendor due-diligence, data-residency and exit-strategy review. EU-region hyperscalers are the safe default.
2. **Data residency & identity.** Data stays in EU/Denmark regions; personal Google accounts / Sheets are out. Identity is the corporate IdP (Entra ID / Azure AD), and automation uses **managed identities / workload-identity federation** — the enterprise way to kill the OAuth bottleneck: a machine identity with least privilege and full audit, not a person's login.
3. **Segregation of duties.** Regulators require that only approved, tested, requested changes reach production. So full auto-merge-to-prod (fine for a personal repo) becomes **governed autonomy**: agents + CI run everything autonomously *up to* prod, but the prod deploy is gated by an approver + change record + immutable audit log.

### The stack companies like EIFO typically use

| Layer | Personal (earlier rec) | EIFO-grade |
|---|---|---|
| Cloud | Cloudflare / GitHub-hosted | **Azure** (EU region; AWS as alt) — sanctioned, DORA-designated |
| SCM + CI/CD | GitHub + Actions | **GitHub Enterprise** or **Azure DevOps** (SSO via Entra ID; Azure DevOps is strong on release-governance/approval gates) |
| Identity / secrets | API tokens in CI | **Entra ID + managed identity / workload federation**, **Key Vault** |
| Compute / cron | Actions cron | **Azure Container Apps Jobs / Functions Timer / Logic Apps** (private, EU) |
| Hosting | Cloudflare Pages | **Azure Static Web Apps / App Service / Container Apps** (private endpoints) |
| Storage | git-as-data | EU-resident managed store (**Azure SQL / Storage**) + git for code/history |
| Provisioning | minimal | **Terraform / Bicep + Azure Policy**, landing zones |
| Security gates | tests + gate | + **SAST / secret & dependency scanning** (CodeQL / Defender for DevOps), SBOM, audit logs |
| Prod deploy | auto-merge | **Approval gate (4-eyes) + change record** |

### Risk-tiering (don't over-engineer)

EIFO governance is risk-based. A small *internal, non-sensitive* tool like a daily news brief sits at a low tier — it still must run on sanctioned cloud + identity, but it won't need the full customer-facing-financial-system control set. Match controls to the data classification.

### Caveat

This is the *archetype* for a regulated Nordic state-finance entity, **not EIFO's confirmed internal stack** (that isn't public). The authoritative sources are EIFO's own approved-vendor list, security/architecture standards, and DORA register — confirm with their IT/security/compliance function before committing.

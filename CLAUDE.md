# CLAUDE.md

This is the persistent context every Claude Code session on this repository should read first. The full source of truth is **[`docs/engineering-brief.md`](docs/engineering-brief.md)** — read it once, follow it, raise questions when it is silent rather than inventing positions.

This repository (`bmodernh/bmodern-tender-portal`) is the **prototype** of a tender and upgrade portal built on Manus for B Modern Homes. It is currently used in production by B Modern. The commercial rebuild as a multi-tenant SaaS is happening in a separate repository; this codebase is being treated as the **spec**, not the source, for that rebuild. Phase 1 here is a written audit of the prototype to inform that rebuild. No code changes during Phase 1.

## Engineering principles (condensed from sections 3–4 of the brief)

- TypeScript strict mode, end to end. Types are enforced by build and CI.
- Domain logic separated from framework and database code. Pure functions where practical; side effects at the edges.
- Tests cover every meaningful behaviour. Domain layer ≥ 70% line coverage. Critical end-to-end flows have integration tests. CI blocks merging on failure.
- Errors handled deliberately — no swallowed exceptions, no untyped catch blocks. User-facing errors have stable codes; internal errors are logged with structured context and reported to an error tracker.
- Secrets only in env vars / secrets manager, never in the repo. Migrations are versioned and reversible. Logs are structured JSON with request id, tenant id, user id.
- One way to do common things (one HTTP client, one form library, one validation library, one styling approach), documented in the contributor guide.
- Multi-tenancy is enforced **at the data layer**, not the UI. Every query touching tenant data is scoped by tenant id at a level that cannot be bypassed.
- Auth is explicit and centralised. No route is open by default.
- Boring, proven technology over novelty. Customers are builders, not engineers.

## Working agreement (section 8 of the brief)

- Read the relevant files before any non-trivial change. Propose a plan in writing. Wait for approval.
- Never invent file paths, function names, or library APIs. Verify by reading the codebase or the docs.
- Run tests and the linter before declaring a task complete. Paste the output.
- Conventional commits. Clear subject; body explains the why.
- Out-of-scope-but-worth-fixing findings go to `docs/findings.md`, not silent edits.
- Deliberate trade-offs get a code comment with the alternative considered.
- When blocked, stop and ask. Do not guess.
- No direct pushes to `main`. Every change goes through a PR.

## Phase 1 — repository audit (run this first)

Run this in a fresh session at the root of this repository. **Do not modify any code during this phase.**

> Read every file in this repository, including configuration, scripts, and documentation. Then produce a written audit at `docs/audit/phase-1-audit.md` covering the following sections.
>
> **Stack and architecture.** What language, framework, database, and hosting model is this built on. What are the key dependencies and their versions. How is the code organised. Where does configuration live. How is the application built and deployed today.
>
> **What the application does.** Walk through every user flow you can identify from the code. List the data models and their relationships. Identify the entry points and the main pages or routes.
>
> **Single tenant assumptions.** List every place in the code that assumes there is only one customer. Hardcoded company names, single database without tenant scoping, shared file paths, environment baked branding, queries that are missing a tenant filter, anything that would break or leak data the moment a second tenant exists.
>
> **Code quality issues.** Security holes, missing input validation, secrets committed to the repository, lack of tests, missing error handling, N plus one queries, blocking operations on the request path, missing indexes, anything you would call out in a code review. Rank each issue as critical, high, medium, or low.
>
> **SaaS gaps.** What is missing for this to be a sellable product. Signup, onboarding, billing, role based access, password reset, email verification, audit logs, admin panel, monitoring, backups, terms and privacy pages, customer support tooling.
>
> **Recommended phased plan.** Based on what you found, propose the next four to six phases of work, each scoped small enough to ship in one to two weeks. For each phase list the goal, the files likely to change, the risks, and how we will know it is done.
>
> Output the full audit as a single markdown file. Do not modify any other files. When done, summarise the top five findings in your reply.

After Phase 1 lands, Dusan and Claude Code agree on the next phase in writing before any code is written.

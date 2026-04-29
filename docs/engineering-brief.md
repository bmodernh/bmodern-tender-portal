# B Modern Tender Portal — Engineering Brief

**Repository:** https://github.com/bmodernh/bmodern-tender-portal
**Live prototype:** https://bmodernportal-imexqjpp.manus.space
**Prepared for:** Claude Code working sessions
**Owner:** Dusan, B Modern Homes (info@bmodernhomes.com.au)
**Status:** Prototype built on Manus → being rebuilt as a multi-tenant SaaS product

---

## 1. Project Overview

The B Modern Tender Portal began as an internal tool for B Modern Homes, an Australian residential building company, to manage the tender process — issuing requests for pricing to subcontractors, collecting quotes, comparing line items, and awarding work. The first version was assembled rapidly on the Manus platform to prove the concept and run live tenders for B Modern's own projects.

The next chapter is to take everything that has been learned from running real tenders and turn the portal into a commercial SaaS product that other Australian builders, project managers, and head contractors can subscribe to. The goal is a polished, secure, multi-tenant application with the kind of code quality that an acquirer or a serious technical hire would respect on first read.

This document is the working brief that Claude Code should use as its north star across every session on this repository. It is intentionally opinionated. When a decision needs to be made and this brief gives an answer, follow the brief. When this brief is silent or ambiguous, raise the question with Dusan rather than inventing a position.

---

## 2. Vision and Commercial Goals

The product is a tender and subcontractor management platform aimed at small to mid-sized residential and commercial builders in Australia, with later expansion to New Zealand and the UK. The core promise to the customer is that running a tender for a new build, renovation, or commercial fit-out should take hours rather than days, with full visibility, fair comparison of quotes, and a permanent audit trail.

A successful v1 looks like a builder being able to sign up with a credit card, invite their team, upload a set of project documents, send a tender package to a curated list of subcontractors, receive structured quotes back, compare them side by side, and award the package — all without ever asking us for help. Pricing should support at least a free trial, a single-builder plan, and a multi-seat plan. Long term the product should be defensible by being the system of record for a builder's subcontractor network and historical pricing data.

---

## 3. Definition of Premium Code

Premium code, in the context of this project, means code that a senior engineer joining the team next year would describe as a pleasure to work in. Concretely:

The codebase is fully typed end to end. If the existing prototype is JavaScript, it is migrated to TypeScript with strict mode enabled. Types are not decorative; they are enforced by the build and the CI pipeline.

Business logic is separated cleanly from framework code and from the database. A reader can find the rules of the domain without wading through controllers or React components. Pure functions are preferred wherever they are practical, and side effects are pushed to the edges.

Every meaningful behaviour is covered by an automated test. Unit tests cover business logic with a minimum of seventy percent line coverage on the domain layer. Integration tests cover the critical end to end flows: signup, creating a tender, inviting a subcontractor, submitting a quote, comparing quotes, awarding work, and handling billing. Tests run in CI on every pull request and block merging on failure.

Errors are handled deliberately. There are no swallowed exceptions, no untyped catch blocks, and no fallthroughs that quietly hide a problem. User facing errors return clean messages with a stable error code; internal errors are logged with structured context and reported to an error tracker such as Sentry.

Secrets live in environment variables and a secrets manager, never in the repository. Database migrations are versioned, reversible, and reviewed. Logs are structured JSON with request ids, tenant ids, and user ids. Observability is treated as a first class feature, not an afterthought.

The repository is opinionated and consistent. Linting and formatting run on every commit. There is one way to do common things — one HTTP client, one form library, one validation library, one styling approach — and that one way is documented in the contributor guide.

Finally, the code reads as if it was written for the next person, not for the machine. Names are precise, comments explain the why, and the README walks a new engineer from a fresh laptop to a running development environment in under fifteen minutes.

---

## 4. Engineering Principles

The product is built around a few non-negotiable principles. Multi-tenancy is enforced at the data layer, not just in the UI. Every query that touches tenant data is scoped by tenant id at a level that cannot be bypassed by a forgotten where clause. Authentication and authorisation are explicit and centralised; no route is open by default.

The system is built for observability from day one. Every request is traceable through the stack. Every background job logs its inputs, outputs, and duration. Every external API call is wrapped with retries, timeouts, and circuit breakers where appropriate.

Backwards compatibility is taken seriously once the product has paying customers. Database changes are expand-then-contract. Public API endpoints are versioned. Deprecations are announced and dated.

The build favours boring, proven technology over novelty. We are not the customer for a bleeding edge framework; our customers are builders who need their portal to work on a Tuesday morning when a tender is due at noon.

---

## 5. Phased Roadmap

The work is broken into discrete phases. Each phase ends with a working, deployable product that is strictly better than the previous phase. Claude Code should never work on more than one phase at a time, and every phase ends with a written summary that updates this brief.

**Phase 1 — Repository audit and roadmap confirmation.** Read the existing codebase end to end and produce a written audit. No code changes. The audit is the deliverable. Detailed instructions are in section seven.

**Phase 2 — Foundation hardening.** Migrate to TypeScript strict mode if needed, set up linting, formatting, CI, error tracking, structured logging, and a baseline test harness. Add a contributor guide and a working local development setup. No new features.

**Phase 3 — Multi-tenancy and authentication.** Introduce a tenant model, scope every existing query by tenant id, build signup and onboarding, role based access control with at minimum owner, admin, estimator, and viewer roles, password reset, email verification, and session management. Migrate any existing B Modern data into a single seed tenant.

**Phase 4 — Billing and plans.** Integrate Stripe with at least a free trial, a solo plan, and a team plan. Enforce plan limits in code. Build a billing portal for customers to manage payment methods and download invoices. Handle failed payments and grace periods gracefully.

**Phase 5 — Product polish and admin.** Build an internal admin panel for support, a customer facing settings area, an audit log viewable by admins, email templates with proper branding, and a basic onboarding checklist for new tenants.

**Phase 6 — Launch readiness.** Penetration test, load test, backup and restore drill, status page, customer support inbox, terms of service, privacy policy, and a documented incident response runbook. Soft launch to a handful of friendly builders, gather feedback, iterate.

Subsequent phases will be defined after Phase 6 based on what real customers ask for.

---

## 6. SaaS Architecture Requirements

The target architecture is a single application serving multiple tenants from a shared database, with row level tenant scoping enforced at the data access layer. Each tenant has its own users, projects, tenders, subcontractors, quotes, and files. File storage is segregated by tenant id in the object store path, with signed URLs for download. Background jobs carry the tenant context through the queue.

Authentication uses email and password with optional magic link sign in, sessions stored in HTTP only secure cookies, CSRF protection on state changing requests, and rate limiting on the login and password reset endpoints. Passwords are hashed with a modern algorithm such as Argon2id. Two factor authentication is on the roadmap but not required for v1.

Email is sent through a transactional provider such as Postmark or Resend, with templates stored in the repository and rendered server side. All outbound email is logged. Bounces and complaints are handled.

Hosting should be on a platform that supports zero downtime deploys, automatic backups, and easy rollback. Suggested defaults are Fly.io, Render, or Railway for the application, Postgres as the primary database, and Cloudflare R2 or AWS S3 for file storage. The choice should be made in Phase 2 and documented.

---

## 7. Phase 1 Instructions for Claude Code

This is the prompt to run first, in a fresh Claude Code session at the root of the repository. Do not skip steps and do not modify any code during this phase.

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

After this audit lands, Dusan and Claude Code review it together, agree on the next phase, and write a focused prompt for that phase using the same shape: goal, context, constraints, plan first, verification.

---

## 8. Working Agreement With Claude Code

Claude Code operates as a careful senior engineer on this codebase. Before any non-trivial change, it reads the relevant files, proposes a plan in writing, and waits for approval. It never invents file paths, function names, or library APIs; if it is not sure, it greps the repo or reads the documentation. It runs the test suite and the linter before declaring a task complete, and it pastes the output. It writes commit messages in the conventional commits style with a clear subject and a body explaining the why.

When it discovers something out of scope but worth fixing, it adds a note to `docs/findings.md` rather than silently fixing it. When it makes a deliberate trade-off, it leaves a comment in the code explaining the decision and the alternative considered. When it is blocked, it stops and asks rather than guessing.

Claude Code does not push directly to the main branch. Every change goes through a pull request with a clear description, a checklist of what was tested, and screenshots or terminal output where relevant. The pull request template lives at `.github/pull_request_template.md` and is created in Phase 2.

---

## 9. Verification and Definition of Done

A task is done when the code is merged to main, the test suite is green, the linter is clean, the change is deployed to the staging environment, the relevant documentation is updated, and a short note is added to `CHANGELOG.md` describing what changed and why. For user facing changes, a screenshot or short screen recording is attached to the pull request. For data model changes, the migration is reversible and has been tested in both directions on a local database with seed data.

For Phase 1 specifically, done means the audit file exists, has been read by Dusan, and the next phase has been agreed in writing.

---

## 10. Out of Scope for v1

To keep the first sellable version achievable, the following are explicitly out of scope and should not be built unless this brief is updated. Mobile applications, native or otherwise. Real time collaborative editing of documents. AI features beyond what already exists in the prototype. Integrations with accounting packages such as Xero or MYOB. White label deployments. On-premise installations. Languages other than English. Currencies other than Australian dollars.

These are all reasonable future bets but they are distractions from getting the first ten paying customers.

---

## 11. Open Questions for Dusan

These are the decisions that should be made before Phase 2 begins, ideally during the Phase 1 audit review. Which hosting platform and database provider should we standardise on. Which transactional email provider. Which error tracking and logging provider. What is the target price point for the solo and team plans. Which jurisdictions matter for data residency — Australia only, or also New Zealand and the United Kingdom. Is there an existing brand identity, logo, and colour palette we should respect, or do we design fresh in Phase 5. What is the trade name and legal entity that will own the SaaS product.

None of these block Phase 1. All of them shape Phase 2 onward.

---

*End of brief. This document is the source of truth for the rebuild. Update it deliberately, in pull requests, with a clear reason for the change.*

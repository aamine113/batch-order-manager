# CLAUDE.md

Guidance for Claude when working in this repository. Keep this file short and update it when a convention changes.

## Project

Order manager for group order batches with a weight limit. It is also a portfolio project, so code quality, tests and documentation matter as much as features.

- Full requirements: private specification, kept outside the repository. Ask the developer for the relevant section before starting a milestone.
- Current status: Milestone 1 (setup, MongoDB, CI) done. Next: Milestone 2 (users and auth, products, batches).

## Stack and layout

- `backend/`: NestJS (ES modules), TypeScript strict mode, MongoDB with Mongoose, class-validator and class-transformer, Passport with JWT, Swagger.
- `frontend/`: React with Vite and TypeScript. Planned for Milestone 5, does not exist yet.
- `docker-compose.yml` at the repository root: MongoDB as a single-node replica set (`rs0`). Transactions require a replica set.
- Node 24 LTS through fnm. Tests: Vitest (unit) and Supertest (end-to-end). Lint and format: Oxlint and Prettier.

## Commands

Run from `backend/`:

```bash
npm run lint && npm run build && npm test   # the checks CI runs
```

- Start the database from the repository root: `docker compose up -d` (Docker Desktop must be running).
- Environment: copy `backend/.env.example` to `backend/.env`. Never commit `.env`.
- End-to-end tests are not in CI yet.

## Conventions

- Conventional Commits: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `test:`.
- Strict TypeScript. No `any` without a comment explaining why.
- Validate every endpoint input with DTOs. Guard routes by role (admin, client).
- Document every route with OpenAPI decorators.
- Money and weight calculations live on the server and are unit tested. Never trust totals sent by the client.
- Do not run `npm audit fix --force`.

## Domain rules

The domain rules live in the private specification (see below). Read it before feature work and do not restate them in tracked files.

## Atomicity and concurrency

- Any check that depends on current data goes inside the write itself, using an atomic operation (`findOneAndUpdate` or `updateOne` with the condition in the filter). Do not read, check, then write.
- Any business operation that writes to more than one document runs in a transaction, and the session is passed to every query inside it.
- Never assume atomicity or consistency without enforcing it in code.

## Working agreements

- The developer runs installs and commands. Guide one step at a time and wait for confirmation before the next one.
- The developer writes the capacity-enforcement service and its concurrency test personally. Claude reviews them but does not write them.
- Review the spec section with the developer before starting each milestone.
- Challenge a design decision when it looks wrong, with the trade-offs, rather than implementing it silently.

## Public repository rules

- Never commit secrets or `.env` files. If a secret is committed by mistake, rotate it immediately: deleting the commit is not enough.
- Seed scripts and tests use fake data only: no real client names, contact details or orders.
- Keep the repository name and content brand-free.

## Private project docs

- `private-docs/` is a gitignored folder with the project specification (`SPEC.md`). It is the source of truth for requirements, data model, API and milestones. Read it at the start of a session and before any feature work.
- It is never pushed to the public repository. Never stage, commit or copy it.
- Never quote it or paraphrase its wording in commit messages, code comments, README, Swagger text, test names, seed data or any other tracked file. Business names, brand names, client details and storefront names must not appear anywhere in tracked files.
- Use neutral naming in the code (for example "batch", "client", "product").
- Before every commit, run `git diff --staged` and check it for private details. If a spec change is needed, tell me; I update the spec myself.

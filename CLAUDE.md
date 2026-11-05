# CLAUDE.md

Guidance for Claude when working in this repository. Keep this file short and update it when a convention changes.

Current state and next steps (private, see "Private project docs"):

@~/dev/batch-order-manager/private-docs/HANDOFF.md

## Project

Order manager for group order batches with a weight limit. It is also a portfolio project, so code quality, tests and documentation matter as much as features.

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

- Commit only through the `/commit` skill (`.claude/skills/commit/`).
- Conventional Commits: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`.
- Tests go in the same commit as the code they test.
- Strict TypeScript. No `any` without a comment explaining why.
- Validate every endpoint input with DTOs. Guard routes by role (admin, client).
- Document every route with OpenAPI decorators.
- Every new or changed route gets a request in `backend/http/<module>.http`, in the same commit. No real tokens or passwords in these files.
- Money and weight calculations live on the server and are unit tested. Never trust totals sent by the client.
- Keep constants and helper functions out of classes: put them in their own dedicated files and import them.
- A service takes a DTO directly when the HTTP shape matches what is stored. Otherwise it defines its own input type in `<module>/types/`.
- Do not run `npm audit fix --force`.

## Branching and PRs

- `main` is protected: changes land only through a rebase-merged pull request with the `backend` status check passing.
- Never commit on `main`. One branch per task, named `<type>/<short-description>`, with `<type>` one of `feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `test`. `/commit` stops on `main` and proposes a branch name.
- Every pull request goes through the `/pr` skill (`.claude/skills/pr/`): branch and commit checks, rebase onto `origin/main`, title and body draft, private-details check, push, `gh pr create`.
- Review fixes go in as `git commit --fixup=<sha>` commits. `/pr` folds them before merge.
- Inside `/commit` and `/pr`, Claude runs the checks and the `git` and `gh` commands itself; every decision stays with the developer.
- `--force-with-lease` only after a rebase and with the developer's confirmation. Never `--force`.
- Claude never merges a pull request. Merging is the developer's decision.

## Atomicity and concurrency

- Any check that depends on current data goes inside the write itself, using an atomic operation (`findOneAndUpdate` or `updateOne` with the condition in the filter). Do not read, check, then write.
- Any business operation that writes to more than one document runs in a transaction, and the session is passed to every query inside it.
- Never assume atomicity or consistency without enforcing it in code.

## Working agreements

- The developer runs installs and commands. Guide one step at a time and wait for confirmation before the next one. Exception: inside the `/commit` and `/pr` skills, Claude runs the checks and the `git` and `gh` commands itself.
- The developer writes the capacity-enforcement service and its concurrency test personally. Claude reviews them but does not write them.
- Review the spec section with the developer before starting each milestone.
- Challenge a design decision when it looks wrong, with the trade-offs, rather than implementing it silently.

## Public repository rules

- Never commit secrets or `.env` files. If a secret is committed by mistake, rotate it immediately: deleting the commit is not enough.
- Seed scripts and tests use fake data only: no real client names, contact details or orders.
- Keep the repository name and content brand-free.

## Private project docs

`private-docs/` is gitignored and is its own private Git repository. Worktrees do not contain it: always use the main checkout's copy at `~/dev/batch-order-manager/private-docs/`. In this file and in `.claude/skills/`, `private-docs/` means that folder.

- `~/dev/batch-order-manager/private-docs/SPEC.md`: requirements and decisions, the source of truth. Too large to import: before designing or implementing a feature, read the relevant section.
- `~/dev/batch-order-manager/private-docs/SETUP.md`: dev setup and GitHub workflow. Read it when a task touches the environment, CI or GitHub settings.
- `~/dev/batch-order-manager/private-docs/HANDOFF.md`: current state and next steps, imported above.

Rules:

- Never stage, commit or copy anything from `private-docs/` into this repository.
- Nothing from `private-docs/` may appear anywhere in this public repository or on GitHub: commit messages, PR titles and bodies, code comments, README, Swagger text, test names, seed data, skills in `.claude/skills/`, this file. Do not quote or paraphrase it. Domain rules, business names, brand names, client details and storefront names stay out of tracked files.
- Use neutral naming in the code (for example "batch", "client", "product").
- Before every commit, run `git diff --staged` and check it for private details.
- Claude may edit the files in `private-docs/`, including `SPEC.md`, but asks the developer for confirmation before each change.

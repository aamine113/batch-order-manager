---
name: commit
description: Prepare and create a commit for this repository. Runs the CI checks, reviews the staged diff against the public-repository rules, proposes how to split the changes into commits, and writes Conventional Commit messages. Use when the developer asks to commit staged or pending changes.
disable-model-invocation: true
---

# Commit

Follow these steps in order. Stop and wait for the developer's answer wherever a step says so.

## 1. Inspect the changes

Run `git status` and `git diff --staged`. If nothing is staged, show the unstaged changes and ask the developer what to stage. Do not stage files yourself unless asked.

## 2. Offer a review

Offer to run `/code-review medium` on the staged changes, and mention `/simplify` as an optional extra pass for code quality. Wait for the developer's choice; they may skip both.

- `/code-review` only reports findings. Present them and apply only the fixes the developer accepts.
- `/simplify` edits files directly. After it runs, show what it changed and let the developer decide what to keep and restage.

Any fix leaves unstaged changes. Ask the developer to review and stage them before moving on.

## 3. Run the checks

From `backend/`, run the same checks CI runs:

```bash
npm run lint && npm run build && npm test
```

If a check fails, report the output and stop. Do not commit on a failing check, and do not fix the failure without asking.

## 4. Check the staged diff against the public-repository rules

Go through the staged diff and confirm that:

- No `.env` file, secret, token or credential is staged.
- Nothing from `private-docs/` is staged, quoted or paraphrased.
- No business names, brand names, client details or storefront names appear in code, comments, tests, seed data, Swagger text or docs.
- Test and seed data are clearly fake.

Report any finding with the file and line, and stop until the developer resolves it.

## 5. Propose how to split the commits

Decide whether the staged changes belong in one commit or several. Suggest a split when the changes cover more than one concern, for example:

- separate modules or features
- a refactor mixed with new behaviour
- tooling, config or dependency changes mixed with feature code
- docs changes unrelated to the code changes

Every commit must build and pass the tests on its own. Order the commits so that each one only depends on code already committed or included in it:

- Commit a module before the code that imports it, including its registration in `app.module.ts`.
- Keep a dependency change in `package.json` and `package-lock.json` in the same commit as the first code that uses it.
- Keep a unit test in the same commit as the code it tests, or in a later one.

For each proposed commit, list the files it contains and its message. Wait for the developer to accept or change the plan.

## 6. Write the commit messages

Use Conventional Commits: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `test:`, with a scope when it helps, such as `feat(users):`. Keep the subject line under 72 characters, in the imperative mood, without a trailing period. Add a body only when the reason for the change is not obvious from the subject.

Show the final messages and wait for the developer's approval before committing.

## 7. Commit

Create the commits in the agreed order, staging only the files planned for each one. Afterwards, run `git log --oneline` for the new commits and `git status` to confirm the tree is in the expected state. Do not push.

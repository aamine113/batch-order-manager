---
name: pr
description: Open a pull request for the current branch. Checks the branch and its commits, rebases onto main when needed, drafts a Conventional Commit title and a body, runs the public-repository check, pushes the branch and creates the pull request with gh. Never merges. Use when the developer asks to open a pull request.
disable-model-invocation: true
---

# Pull request

Follow these steps in order and stop at the first failure. Claude runs only checks and `git` or `gh` commands; every decision stays with the developer. Stop and wait for the developer's answer wherever a step says so.

Some commands answer a question through their exit code: `git merge-base --is-ancestor`, `git rev-parse --verify --quiet` and `gh pr view` exit non-zero when the answer is no. That is an answer, not a failure.

## 1. Check the working tree

Run `git branch --show-current` and `git status`.

- If the current branch is `main`, stop: pull requests come from a branch.
- If the working tree has staged, unstaged or untracked changes, stop and ask the developer to run `/commit` first.

## 2. Check the branch name

The branch name must match `<type>/<short-description>`:

```
^(feat|fix|chore|ci|docs|refactor|test)/[a-z0-9]+(-[a-z0-9]+)*$
```

If it does not match, stop and suggest a name. Renaming the branch (`git branch -m <new-name>`) is the developer's decision.

## 3. Bring the branch up to date

Run `git fetch origin`. Then check whether `origin/main` is an ancestor of `HEAD`:

```bash
git merge-base --is-ancestor origin/main HEAD
```

If it is not, the branch is behind. Show the commits it is missing (`git log --oneline HEAD..origin/main`), propose `git rebase origin/main` and wait for the developer's answer.

If the rebase stops on a conflict, report the conflicting files and stop. Do not resolve conflicts or run `git rebase --abort` without asking.

## 4. Fold fixup commits

List the branch commits with `git log --oneline origin/main..HEAD`. If any subject starts with `fixup!` or `squash!`, propose:

```bash
GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash origin/main
```

Wait for the developer's answer. When steps 3 and 4 both apply, this one command covers both.

## 5. Check the commit messages

Every commit in `origin/main..HEAD` must be a Conventional Commit:

```
^(feat|fix|chore|ci|docs|refactor|test)(\([a-z0-9-]+\))?!?: .+
```

If a subject does not match, report it and stop. Rewording commits is the developer's decision.

## 6. Run the checks

From `backend/`, run the same checks CI runs:

```bash
npm run lint && npm run build && npm test
```

Always run them after a rebase in step 3 or 4. Otherwise, run them once here so the Testing section reports the current state of the branch. If a check fails, report the output and stop. Do not fix the failure without asking.

## 7. Draft the title and the body

First check for an existing pull request with `gh pr view --json url,state,title,body`. If an open one exists, show its current title and body, and draft the updates against them.

- Title: a Conventional Commit subject that covers the whole branch, under 72 characters, in the imperative mood, without a trailing period. For a single-commit branch, reuse the commit subject.
- Body, in Markdown:
  - `## Summary`: what the branch does and why, in two or three sentences.
  - `## Changes`: one line per commit, oldest first, taken from `git log --reverse --format='- %s' origin/main..HEAD`.
  - `## Testing`: the checks that ran in step 6 and their result, and any manual testing the developer reports. Say which checks did not run, such as end-to-end tests that are not in CI.
  - End the body with the attribution line required for pull requests, if one is configured.

Show the title and the body and wait for the developer's approval or edits.

## 8. Check the public-repository rules

The pull request is public. Apply the same rules as the `/commit` skill to the approved title, the approved body and every branch commit message (`git log --format=%B origin/main..HEAD`):

- No secret, token or credential.
- Nothing from `private-docs/` quoted or paraphrased.
- No business names, brand names, client details or storefront names.

Report any finding and stop until the developer resolves it.

## 9. Push the branch

Decide from the state of the remote branch, not from whether this run rebased. After a `git fetch origin`:

- If `git rev-parse --verify --quiet origin/<branch>` finds no remote branch, or `git merge-base --is-ancestor origin/<branch> HEAD` succeeds, run `git push -u origin <branch>`.
- Otherwise the branch has diverged from `origin`, usually after a rebase, and a force push is needed. Show the remote commits that would be replaced (`git log --oneline HEAD..origin/<branch>`), ask for confirmation, then run `git push -u --force-with-lease origin <branch>`. Never use `--force`.

If the push is rejected, report the output and stop.

## 10. Create or update the pull request

Write the approved title and the approved body to two temporary files created with `mktemp`. Never put the title inline in the command: backticks, `$` or quotes in it would be interpreted by the shell. The output of `$(cat ...)` is not expanded again, so it is safe.

If step 7 found an open pull request, the push already updated its commits. If the developer approved a new title or body, run:

```bash
gh pr edit <branch> --title "$(cat <title-file>)" --body-file <body-file>
```

Otherwise, run:

```bash
gh pr create --base main --head <branch> --title "$(cat <title-file>)" --body-file <body-file>
```

Delete the temporary files and print the pull request URL.

## 11. Watch the checks

Checks can take a few seconds to register after the push. Run `gh pr checks --watch` with a Bash timeout of 600000 ms, since CI can run longer than the default 2 minutes. If gh reports that no checks were found, wait about 15 seconds and retry once.

Report the result. If a check fails, show which one and stop.

## 12. Stop

Never merge the pull request, enable auto-merge or approve it. Merging is the developer's decision, using a rebase merge.

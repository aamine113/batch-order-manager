---
name: review-notes
description: Go through the review notes filed in review-notes.md during an implementation, one at a time, before committing. Answers questions, proposes changes, and lays out trade-offs for disagreements. Use when the developer agrees to review open notes, or asks to go through them.
---

# Review notes

Notes are filed in `review-notes.md` at the repository root, in the line format given in the "Review notes" section of `CLAUDE.md`.

Follow these steps in order. Stop and wait for the developer's answer wherever a step says so.

## 1. Read the notes

Read `review-notes.md`. If it is missing or has no unticked (`- [ ]`) lines, say so and stop.

## 2. Show the overview

Show the number of open notes, grouped by file. Do not discuss them yet.

## 3. Go through the notes

Take the open notes one at a time, in file order. For each note:

1. Locate the code by searching the file for the anchor. If it is not found, or matches more than once, say so and ask the developer where the code is.
2. Show the location and the note, then handle it by kind:
   - Question: answer it, including the reason behind the choice made.
   - Change request: propose the edit as a diff, through the normal approval prompt.
   - Disagreement: lay out the trade-offs and a recommendation. The developer decides.
   - Deferred ("later"): offer a one-line entry under "Known gaps" in `private-docs/HANDOFF.md`, and write it only after the developer confirms.
3. Wait for the developer. Once the note is settled, tick it (`- [x]`) and move to the next one.

## 4. Clean up

Remove the ticked lines from `review-notes.md`. If no lines remain, delete the file.

List the files changed during this review, so the developer can restage them before `/commit`.

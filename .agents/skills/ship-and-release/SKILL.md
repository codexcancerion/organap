---
name: ship-and-release
description: Exact release & push workflow that validates the codebase (typecheck / lint / test / build), bumps package.json, updates CHANGELOG.md + docs/changelog.md mirror, creates a release commit, migrates remote Supabase, and pushes to git. Trigger with /ship, /release, or "ship and release".
---

# Ship & Release Pipeline Skill

This skill automates the exact shipping and release workflow for the Voxsels codebase. It ensures the codebase is type-safe, lint-clean, tested, buildable, versioned, documented, migrated on remote Supabase, and pushed to git.

## When to use it

Invoke this workflow whenever you are ready to validate, release, migrate remote database, and push to GitHub.

## Usage

```bash
# Instant preview of next version, changelog, and release plan (skips heavy gates)
npm run ship -- --preview

# Standard release & push workflow (full quality gates, patch bump, commit, migrate DB, push)
npm run ship

# Streamlined release (skips re-running unit tests if already verified in development/testing)
npm run ship -- --fast
# or
npm run ship -- --skip-test

# Targeted release (runs Vitest only on files changed since last release/commit)
npm run ship -- --changed-only

# Minor bump release and push (e.g. 0.9.0 -> 0.10.0)
npm run ship -- --minor

# Major bump release and push (e.g. 0.9.0 -> 1.0.0)
npm run ship -- --major

# Useful flags
#   --fast / --quick  bypass unit tests (use when tests were already verified prior to ship)
#   --changed-only    run Vitest only on modified/affected test suites
#   --skip-test       skip unit test suite (vitest)
#   --skip-build      skip Next.js production build
#   --preview         instant preview of bump & changelog without running quality gates
#   --dry-run         preview release without modifying files, migrating DB, or pushing
#   --skip-db         skip remote Supabase migration (npx supabase db push)
#   --skip-push       skip git push to remote
#   --skip-git        skip both release commit and git push
#   --allow-dirty     continue with uncommitted changes in the tree
#   --yes / PRE_PUSH_FORCE=1   skip interactive confirmations
```

## How the exact workflow works

1. **Workspace cleanliness check**: Refuses to run with a dirty working tree unless `--allow-dirty`, `--yes`, or `--preview` is passed.
2. **Quality gates** (runs in order, aborts on failure; bypassed in `--preview`):
   - `npm run typecheck` (`tsc --noEmit`)
   - `npm run lint` (`eslint --fix`)
   - `npm run test` (`vitest run` on full suite, `vitest --changed` with `--changed-only`, or bypassed with `--fast`/`--skip-test`)
   - `npm run build` (`next build`, skippable with `--skip-build`)
3. **Version bump**: Reads `package.json`, increments per `--patch | --minor | --major`, and writes the new version back.
4. **Conventional-Commit scraping**: Walks `git log <last-release>..HEAD` and buckets every commit into Keep-A-Changelog sections (Added, Changed, Fixed, Chore, etc.).
5. **Changelog generation & Docs mirror**: Inserts release notes into `CHANGELOG.md` and mirrors to `docs/changelog.md`.
6. **Release commit**: Stages all changes (`git add -A`) and commits as `chore: release version X.Y.Z`.
7. **Migrate to Remote Supabase**: Automatically synchronizes all pending forward-only migrations from `supabase/migrations/` to the active remote Supabase database (`vxptjksqthwrulohehwr`) via Supabase tools or `npx supabase db push` (skip with `--skip-db`). The agent must always verify and apply unapplied migrations during releases without needing manual prompts.
8. **Git Push**: Pushes commits to the remote repository `origin/<branch>` (skip with `--skip-push`).

## Versioning

Voxsels follows [Semantic Versioning](https://semver.org/). Use
`--major` for breaking changes, `--minor` for new features, and `--patch` (default) for bug fixes / updates.

## Files written

- `package.json` (only `version`)
- `CHANGELOG.md`
- `docs/changelog.md`

## Reference

- [`AGENTS.md`](../../../AGENTS.md) → "Commit messages"
- [`docs/phased_implementation_plan.md`](../../../docs/phased_implementation_plan.md)
- [`docs/architecture.md`](../../../docs/architecture.md)

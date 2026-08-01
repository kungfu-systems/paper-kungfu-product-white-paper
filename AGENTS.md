# Agent Entry

This repository contains the source for a Kungfu product white paper.

Start here:

- Read [`docs/MAP.md`](docs/MAP.md) for the repository map.
- Read [`README.md`](README.md) for the paper scope and product positioning.
- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before changing source files.

Do not add credentials, private logs, unpublished investor correspondence,
private operational data, or internal control-plane records. Keep the repository
focused on public-safe white paper source, reproducible build instructions, and
supporting notes.

<!-- buildchain:paper-agent-entry:v1:start -->
## Paper work entry (required)

This repository uses the Buildchain-managed Paper path. Before changing any
tracked file, inspect the current branch and follow the matching rule:

- On `main`, `dev/v0/v0.1`, or another protected channel, do not edit.
  Switch to the exact current `dev/v0/v0.1`, install the pinned pnpm
  dependencies when needed, then run
  `pnpm paper:work:start -- <topic> --execute --json`.
- On an existing `feature/*`, `fix/*`, `docs/*`, `chore/*`, `ci/*`, or
  `refactor/*` branch, run `pnpm paper:agent:verify` before continuing.
- Before opening or updating a pull request, commit the intended bytes and run
  `pnpm paper:work:submit -- --execute --json`. The target must be
  `dev/v0/v0.1`; direct protected-branch pushes and force pushes are
  forbidden.

The required remote check independently verifies this contract, the exact
Buildchain package and runtime authority, and feature-to-development lineage.
Passing local commands alone is not acceptance, and manually bypassing them
does not bypass remote policy.
<!-- buildchain:paper-agent-entry:v1:end -->

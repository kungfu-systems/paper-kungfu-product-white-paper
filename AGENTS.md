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

<!-- buildchain:next-development:v1:start -->
## Next-development transition (required after Alpha)

Follow [Buildchain next-development ADR](https://github.com/kungfu-systems/buildchain/blob/v4/architecture/decisions/0002-next-development-transition.md) and
`kungfu-buildchain-next-development-transition/v1`. A completed Alpha remains successful and its refs remain immutable while the next-development transition is incomplete.

Use only `semver/auto` or `anchored/manual`. Record `planned`,
`waiting-anchor`, `materialized`, `pr-pending`, `merged`, and `verified`
without changing the completed Alpha outcome. During preparation, never move
an Alpha branch or tag and never write outside declared source and derived
version paths. Treat the anchor manifest as read-only.

The durable controller creates one child keyed by the completed-Alpha root.
Every runner must reuse that child and its compare-and-swap checkpoints. Build
from the latest protected Dev SHA, supersede stale material before opening the
version PR, and do not record `verified` until protected Dev readback matches
the target version plus every declared source and derived root.

Plan locally before opting into declared-path writes:

```sh
node node_modules/@kungfu-tech/buildchain/scripts/next-development-transition.mjs materialize --cwd . --input <request.json>
```

Add `--write` only after reviewing the rooted plan. Anchored/manual consumers
must materialize and root the declared anchor manifest first.
Repository transaction adapters pass the exact target as
`BUILDCHAIN_VERSION`, run `lifecycle.version-state` when derived files are
declared, then run `lifecycle.verify`. The reference writer fails closed for
derived-file consumers; it does not execute arbitrary consumer commands.
<!-- buildchain:next-development:v1:end -->

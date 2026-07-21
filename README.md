# Kungfu: Verified Continuity for Agent Work

This repository tracks the source, site bundles, and Buildchain publication
evidence for the Kungfu product white paper.

Title:

```text
Kungfu: Verified Continuity for Agent Work
```

Subtitle:

```text
Project Cuts, an embeddable runtime, and an open responsibility standard for
work that outlives the chat.
```

The paper defines Project Cut as the first user object for cross-session Agent
work, explains the `libkungfu` runtime beneath it, and separates KFD, Buildchain,
and participant-owned Agent Hub responsibilities. Its recommended builder
strategy is explicit:

```text
Embed libkungfu now. Deliver Project Cut continuity.
Build your KFD-compatible Hub in parallel.
```

The document also records the alpha claim boundary. KFD remains open and
independently implementable; embedding `libkungfu` does not automatically
certify conformance; and the cited evidence is first-party rather than proof of
external vendor adoption or broad production readiness.

Publisher: Kungfu Origin Technology Limited.
Contact: Keren Dong <keren.dong@kungfu.link>.

## Repository Naming

This repository uses the `paper-*` prefix for Kungfu research and white paper
artifacts. The prefix names the repository role, not the current toolchain.
LaTeX is an implementation detail.

## Layout

- [`paper/main.tex`](paper/main.tex): LaTeX entrypoint.
- [`paper/sections/`](paper/sections/): paper sections.
- [`paper/references.bib`](paper/references.bib): bibliography.
- [`docs/MAP.md`](docs/MAP.md): repository map.
- [`.buildchain/buildchain.toml`](.buildchain/buildchain.toml): Buildchain
  publication and release-management contract.
- [`release-impact.json`](release-impact.json): release impact declaration used
  by Buildchain release passports.
- [`package.json`](package.json): npm package surface consumed by paper sites
  and agents.

## Site Bundles

The npm package exposes two generated site bundles from the same paper source:

- [`site/brand-site.json`](site/brand-site.json): product-facing bundle for
  `site-kungfu-tech` / `kungfu.tech`.
- [`site/evidence-site.json`](site/evidence-site.json): artifact and evidence
  bundle for `papers.libkungfu.dev`.

Regenerate them after changing the paper source:

```sh
make update-site-bundles
```

## Build

Install dependencies:

```sh
npm install
```

Run repository and release-surface checks:

```sh
npm run check
```

Build the PDF and Buildchain publication artifact:

```sh
npm run build
```

The public PDF artifact is written to `_build/kungfu-real-world-agent-work.pdf`.
The historical filename and public route remain stable even though the paper's
title and positioning have advanced. Both site bundles use that filename so
existing links and archived alpha releases remain valid.

NPM package dry-run:

```sh
npm pack --dry-run --json
```

The package coordinate is:

```text
@kungfu-tech/paper-kungfu-product-white-paper
```

Buildchain owns release promotion, Trusted Publishing, release passports, and
GitHub Release publication for this repository. Local manual builds may still
use `make pdf`, `make check`, and `make update-site-bundles` for debugging, but
CI and publication should go through the Buildchain lifecycle declared in
`.buildchain/buildchain.toml`.

## Status

This is an alpha product and architecture paper. Source-pinned integration and
evaluation are encouraged now. Stable KFD Hub interoperability, certification,
external vendor adoption, and broad production readiness are not claimed.

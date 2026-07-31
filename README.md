# Kungfu Product White Paper

This repository tracks the source for a Kungfu product white paper.

Working title:

```text
Kungfu: Continuity for Agent Work
```

The paper explains Kungfu as a local-first product and runtime that lets Work
continue across chat boundaries and replaceable Agent processes. It connects
the Project / Work / Agent product model, Agent Work Lab, the KFD Foundation
Triad, Fact and Episode continuity, bounded action authority, Work settlement,
the Agent Supply Chain, and the research bridge from Work continuity to
machine-subject continuity.

Publisher: Kungfu Origin Technology Limited.
Contact: Keren Dong <keren.dong@kungfu.link>.

## Repository Naming

This repository uses the `paper-*` prefix for Kungfu research and white paper
artifacts. The prefix names the repository role, not the current toolchain.
LaTeX is an implementation detail.

## Layout

- [`paper/main.tex`](paper/main.tex): LaTeX entrypoint.
- [`paper/sections/`](paper/sections/): paper sections.
- [`paper/assets/`](paper/assets/): public-safe figures generated from retained
  product evidence.
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

This is an alpha white paper grounded in the current source-built Kungfu
product and its exact qualified evidence. It is not a public-release or
production-fitness claim; the paper states the remaining distribution and
longitudinal validation boundaries explicitly.

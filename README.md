# Kungfu Product White Paper

This repository tracks the source for a Kungfu product white paper.

Working title:

```text
Kungfu: Managing Real-World Work with Agents
```

The paper explains Kungfu as a product and infrastructure direction for
real-world work with agents. It connects the product thesis, KFD principles,
runtime fact infrastructure, dual-first human/agent usability, local-first
operation, and the roadmap from real-world validation to public release.

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
Both site bundles use that stable short filename so downloaded papers remain
distinguishable without exposing the internal `main.tex` entrypoint.

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

This is an initial white paper draft. It should be sharpened against real-world
product validation evidence before being treated as a public launch statement.

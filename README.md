# Kungfu Product White Paper

This repository tracks the source for a Kungfu product white paper.

Working title:

```text
Kungfu: Managing Real-World Work with Agents
```

The paper explains Kungfu as a product and infrastructure direction for
real-world work with agents. It is not a narrow LLM tracing paper. It connects
the product thesis, KFD principles, runtime fact infrastructure, dual-first
human/agent usability, local-first operation, and the roadmap from dogfood to
public release.

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
  publication-artifact contract.

## Build

If `tectonic` is installed:

```sh
make pdf
```

Source-only checks:

```sh
make check
```

Buildchain publication artifact manifest:

```sh
buildchain publication-artifact manifest --source-sha "$(git rev-parse HEAD)" --json
```

## Status

This is an initial white paper draft. It should be sharpened against real
Kungfu dogfood evidence before being treated as a public launch statement.

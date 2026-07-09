# Contributing

This repository is published by Kungfu Origin Technology Limited and follows
the Kungfu public repository baseline.

## Changes

- Keep paper source in `paper/`.
- Keep repository and process notes in `docs/`.
- Do not commit generated PDFs or LaTeX build artifacts.
- Cite primary sources where possible.
- Mark speculative, planned, or unevaluated claims clearly.

## Commit Requirements

Commits should use:

- Developer Certificate of Origin sign-off.
- Lightweight Conventional Commits.
- English commit and pull request text.

Example:

```sh
git commit -s -m "docs(paper): draft observer timeline introduction"
```

## Checks

Run:

```sh
make check
```

If a TeX toolchain is available, also run:

```sh
make pdf
```

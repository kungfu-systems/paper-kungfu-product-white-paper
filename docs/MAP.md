---
status: active
period: ongoing
theme: paper-buildchain-v4
doc_type: reference
source_level: local-files
confidence: high
sensitivity: public
evidence_grade: A
review_state: self-reviewed
last_reviewed: 2026-09-06
ai_provenance:
  model_family: GPT-6
  product: Codex
  generated_at: 2026-09-06
  visible_context: Repository sources and generated Buildchain entry contracts.
  invisible_context_boundary: No private data or hidden model state inspected.
---

# Documentation Map

Start here if you are reading or changing this repository.

| Question | File |
| --- | --- |
| What is this paper? | [`../README.md`](../README.md) |
| What is the LaTeX entrypoint? | [`../paper/main.tex`](../paper/main.tex) |
| Where are the sections? | [`../paper/sections/`](../paper/sections/) |
| How is the publication artifact declared? | [`../.buildchain/buildchain.toml`](../.buildchain/buildchain.toml) |
| What package exports the paper to sites? | [`../package.json`](../package.json) |
| What release impact is declared? | [`../release-impact.json`](../release-impact.json) |
| What should `kungfu.tech` consume? | [`../site/brand-site.json`](../site/brand-site.json) |
| What should `papers.libkungfu.dev` consume? | [`../site/evidence-site.json`](../site/evidence-site.json) |
| How do I build or check it? | [`../README.md`](../README.md#build), [`../Makefile`](../Makefile) |
| What owns CI build and promotion? | [`../.github/workflows/build.yml`](../.github/workflows/build.yml), [`../.github/workflows/paper-release.yml`](../.github/workflows/paper-release.yml) |
| How do I preview promotion manually? | [`../.github/workflows/buildchain-ref-promotion.yml`](../.github/workflows/buildchain-ref-promotion.yml) (dry-run only) |
| What governs required checks and runtime channels? | [`../.github/workflows/verify.yml`](../.github/workflows/verify.yml), [`../.buildchain/contract-lock.json`](../.buildchain/contract-lock.json) (`v4`), [`../.buildchain/alpha-contract-lock.json`](../.buildchain/alpha-contract-lock.json) (`v4-alpha`) |
| What contribution rules apply? | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| What license applies? | [`../LICENSE`](../LICENSE) |

## Public Boundary

This repository is public-safe source for a Kungfu white paper. Do not add
private operational records, internal control-plane records, credentials,
tokens, unpublished commercial negotiation details, or private user data.

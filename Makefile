SOURCE_DATE_EPOCH ?= $(shell git log -1 --format=%ct 2>/dev/null || printf '0')

.PHONY: check update-site-bundles pdf visual-proof clean

check:
	@test -f paper/main.tex
	@test -f paper/references.bib
	@node scripts/check.mjs
	@git diff --check

update-site-bundles:
	node scripts/update-site-bundles.mjs

pdf:
	mkdir -p _build
	SOURCE_DATE_EPOCH="$(SOURCE_DATE_EPOCH)" tectonic --outdir _build paper/main.tex

visual-proof:
	mkdir -p _build
	SOURCE_DATE_EPOCH="$(SOURCE_DATE_EPOCH)" tectonic --outdir _build paper/visual-proof.tex

clean:
	rm -rf _build

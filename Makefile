SOURCE_DATE_EPOCH ?= $(shell git log -1 --format=%ct 2>/dev/null || printf '0')
PDF_NAME := kungfu-real-world-agent-work.pdf

.PHONY: check update-site-bundles pdf clean

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
	mv _build/main.pdf _build/$(PDF_NAME)

clean:
	rm -rf _build

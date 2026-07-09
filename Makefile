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
	tectonic --outdir _build paper/main.tex

clean:
	rm -rf _build

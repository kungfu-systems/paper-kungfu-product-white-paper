.PHONY: check pdf clean

check:
	@test -f paper/main.tex
	@test -f paper/references.bib
	@git diff --check

pdf:
	mkdir -p _build
	tectonic --outdir _build paper/main.tex

clean:
	rm -rf _build

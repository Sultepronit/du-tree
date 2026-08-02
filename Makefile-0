V ?= 0.1.0

run:
	CGO_ENABLED=0 go run .

release/bundler: release/bundler.go
	CGO_ENABLED=0 go build -o release/bundler release/bundler.go

bundle: release/bundler
	@rm -rf internal/embeded/dist
	@./release/bundler
	@cp -r web-gui/index.html internal/embeded/dist
	@cp -r web-gui/icon.svg internal/embeded/dist
	@cp -r web-gui/style internal/embeded/dist

build-bin: bundle
	CGO_ENABLED=0 go build -tags production -o du-tree .

build: build-bin
	cd release/deb && make deb V=$(V)
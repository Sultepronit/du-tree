# V ?= 0.1.0
V := $(shell cat version | tr -d '\r\n')
VAR_PATH := du-tree/internal/server.version


run:
	CGO_ENABLED=0 go run .

release/bundler: release/bundler-1.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -o release/bundler release/bundler-1.go

bundle: release/bundler
	@./release/bundler -v "$(V)"
	@cp -r web-gui/icon.svg internal/embeded/dist

build-bin: bundle
	CGO_ENABLED=0 go build -ldflags="-X '$(VAR_PATH)=$(V)'" -tags production -o du-tree .

build: build-bin
	cd release/deb && make deb V=$(V)
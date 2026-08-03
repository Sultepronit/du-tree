# V ?= 0.1.0
V := $(shell cat version | tr -d '\r\n')
VAR_PATH := du-tree/internal/server.version


run:
	CGO_ENABLED=0 go run -ldflags="-X '$(VAR_PATH)=$(V)'" .

release/bundler: release/bundler.go
	CGO_ENABLED=0 go build -ldflags="-s -w" -o release/bundler release/bundler.go

bundle: release/bundler
	@./release/bundler -v "$(V)"
	@cp -r web-gui/icon.svg internal/embeded/dist

bin: bundle
	CGO_ENABLED=0 go build -ldflags="-X '$(VAR_PATH)=$(V)'" -tags production -o du-tree .

all: build-bin
	cd release/deb && make deb V=$(V)
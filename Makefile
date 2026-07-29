.PHONY: bundle build run

run:
	CGO_ENABLED=0 go run .

bundle:
	CGO_ENABLED=0 go run bundle.go
	@mkdir -p internal/embeded/dist
	cp -r ui/index.html internal/embeded/dist
	cp -r ui/icon.svg internal/embeded/dist
	cp -r ui/style internal/embeded/dist
# 	cp -r ui/{index.html,icon.png,style} internal/embeded/dist

build: bundle
	CGO_ENABLED=0 go build -tags production -o du-tree .


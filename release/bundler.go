package main

import (
	"fmt"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	fmt.Println("Bundling JS...")

	result := api.Build(api.BuildOptions{
		EntryPoints:       []string{"./web-gui/src/main.ts"},
		Outfile:           "./internal/embeded/dist/main.js",
		Bundle:            true,
		Write:             true,
		MinifyWhitespace:  true,
		MinifyIdentifiers: true,
		MinifySyntax:      true,
		Target:            api.ES2020,
		Sourcemap:         api.SourceMapLinked,
	})

	if len(result.Errors) > 0 {
		for _, err := range result.Errors {
			fmt.Println(err.Text)
		}
		return
	}

	fmt.Println("Success!")
}

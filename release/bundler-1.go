package main

import (
	"fmt"
	"os"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	version := "0.2.0-dev.2"
	fmt.Println("Bundling JS...")

	err := os.RemoveAll("./dist")
	if err != nil {
		fmt.Println("Error removing dist directory:", err)
		return
	}

	result := api.Build(api.BuildOptions{
		// EntryPoints: []string{"./web-gui/src/main.ts"},
		// EntryPoints: []string{"../web-gui/src/main-dev.ts"},
		EntryPointsAdvanced: []api.EntryPoint{
			{
				// InputPath:  "../web-gui/src/main-dev.ts",
				InputPath:  "../web-gui/src/main.ts",
				OutputPath: fmt.Sprintf("app-v%s", version),
			},
		},
		// Outfile:           "./internal/embeded/dist/main.js",
		Outdir:            "./dist",
		Bundle:            true,
		Write:             true,
		MinifyWhitespace:  true,
		MinifyIdentifiers: true,
		MinifySyntax:      true,
		Target:            api.ES2022,
		Sourcemap:         api.SourceMapLinked,

		AssetNames: "assets/[name]",

		Loader: map[string]api.Loader{
			".ttf": api.LoaderFile,
			".svg": api.LoaderFile,
		},
	})

	if len(result.Errors) > 0 {
		for _, err := range result.Errors {
			fmt.Println(err.Text)
		}
		return
	}

	for _, file := range result.OutputFiles {
		fmt.Printf("Output file: %s\n", file.Path)
	}

	fmt.Println("Success!")
}

package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	fmt.Println("Bundling web...")

	version := flag.String("v", "~", "version")
	flag.Parse()

	// outdir := "./dist"
	outdir := "./internal/embeded/dist"
	err := os.RemoveAll(outdir)
	if err != nil {
		fmt.Println("Error removing dist directory:", err)
		return
	}

	result := api.Build(api.BuildOptions{
		EntryPoints: []string{
			"./web-gui/ts/main.ts",
			"./web-gui/style/bundle.css",
		},
		// EntryPointsAdvanced: []api.EntryPoint{
		// 	{
		// 		InputPath:  "../web-gui/src/main.ts",
		// 		OutputPath: fmt.Sprintf("app-v%s", version),
		// 	},
		// },
		// Outfile:           "./internal/embeded/dist/main.js",
		Outdir:            outdir,
		Bundle:            true,
		Write:             true,
		MinifyWhitespace:  true,
		MinifyIdentifiers: true,
		MinifySyntax:      true,
		Target:            api.ES2022,
		Sourcemap:         api.SourceMapLinked,

		EntryNames: fmt.Sprintf("app-v%s", *version),
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

	// for _, file := range result.OutputFiles {
	// 	fmt.Printf("Output file: %s\n", file.Path)
	// }

	htmlBytes, err := os.ReadFile("./web-gui/index.html")
	if err != nil {
		panic("Error reading index.html: " + err.Error())
	}
	html := strings.ReplaceAll(string(htmlBytes), "{{VERSION}}", *version)
	err = os.WriteFile(filepath.Join(outdir, "index.html"), []byte(html), 0644)
	if err != nil {
		panic("Error saving index.html: " + err.Error())
	}

	fmt.Println("Success!")
}

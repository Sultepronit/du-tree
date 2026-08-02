package dev

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

func buildAssets() api.BuildResult {
	// version := "0.2.0-dev.2"
	version := "0"
	return api.Build(api.BuildOptions{
		EntryPoints: []string{"./web-gui/src/main-dev.ts"},
		Bundle:      true,
		Write:       false,
		Target:      api.ES2022,
		Sourcemap:   api.SourceMapInline,

		Outdir:  "out",
		Outbase: "..",

		EntryNames: fmt.Sprintf("app-v%s", version),
		AssetNames: "[dir]/[name]",

		Loader: map[string]api.Loader{
			".ttf": api.LoaderFile,
			".svg": api.LoaderFile,
		},
	})
}

func UseEsbuild(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	// w.Header().Set("Content-Type", "application/javascript")

	// result := api.Build(api.BuildOptions{
	// 	EntryPoints: []string{"./web-gui/src/main-dev.ts"},
	// 	Bundle:      true,
	// 	Write:       false,
	// 	Outdir:      "out",
	// 	Target:      api.ES2020,
	// 	Sourcemap:   api.SourceMapInline,
	// })

	result := buildAssets()

	if len(result.Errors) > 0 {
		var errMsg string
		for _, buildErr := range result.Errors {

			errMsg += fmt.Sprintf("❌ %s\\n", buildErr.Text)
			if buildErr.Location != nil {
				errMsg += fmt.Sprintf("   at %s:%d:%d\\n",
					buildErr.Location.File,
					buildErr.Location.Line,
					buildErr.Location.Column,
				)
			}
		}

		w.Header().Set("Content-Type", "application/javascript")
		fmt.Fprintf(w, "console.error(`JS Build Error:\\n%s`);", errMsg)
		return
	}

	// w.Write(result.OutputFiles[0].Contents)

	for _, file := range result.OutputFiles {
		fmt.Printf("Output file: %s\n", file.Path)
		if r.URL.Path == "/style.css" && strings.HasSuffix(file.Path, ".css") {
			w.Header().Set("Content-Type", "text/css")
			w.Write(file.Contents)
			return
		}
		if r.URL.Path == "/main.js" && strings.HasSuffix(file.Path, ".js") {
			w.Header().Set("Content-Type", "application/javascript")
			w.Write(file.Contents)
			return
		}
	}

	http.NotFound(w, r)
}

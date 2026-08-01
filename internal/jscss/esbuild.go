package jscss

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

func buildAssets() api.BuildResult {
	return api.Build(api.BuildOptions{
		EntryPoints: []string{"./web-gui/src/main-dev.ts"},
		Bundle:      true,
		Write:       false,
		Outdir:      "out",
		Target:      api.ES2020,
		Sourcemap:   api.SourceMapInline,

		Loader: map[string]api.Loader{
			".ttf": api.LoaderDataURL,
			".svg": api.LoaderDataURL,
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
		// Якщо браузер попросив /style.css, шукаємо згенерований .css файл
		if r.URL.Path == "/style.css" && strings.HasSuffix(file.Path, ".css") {
			w.Header().Set("Content-Type", "text/css")
			w.Write(file.Contents)
			return
		}
		// Якщо попросив /main.js, шукаємо згенерований .js файл
		if r.URL.Path == "/main.js" && strings.HasSuffix(file.Path, ".js") {
			w.Header().Set("Content-Type", "application/javascript")
			w.Write(file.Contents)
			return
		}
	}

	http.NotFound(w, r)
}

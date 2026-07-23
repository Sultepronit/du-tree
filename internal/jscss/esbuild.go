package jscss

import (
	"fmt"
	"net/http"

	"github.com/evanw/esbuild/pkg/api"
)

func UseEsbuild(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Content-Type", "application/javascript")

	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"./ui/src/main-dev.ts"},
		Bundle:      true,
		Write:       false,
		Target:      api.ESNext,
		Sourcemap:   api.SourceMapInline,
	})

	if len(result.Errors) > 0 {
		// w.WriteHeader(http.StatusInternalServerError)
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
		// w.Header().Set("Content-Type", "text/plain")
		// fmt.Fprintf(w, "JS Build Error: %v", result.Errors)

		fmt.Fprintf(w, "console.error(`JS Build Error:\\n%s`);", errMsg)
		return
	}

	// w.Header().Set("Content-Type", "application/javascript")
	w.Write(result.OutputFiles[0].Contents)
}

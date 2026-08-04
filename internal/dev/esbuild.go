package dev

import (
	"fmt"
	"log"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

func ParseTS() []byte {

	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"./web-gui/ts/main-dev.ts"},
		Bundle:      true,
		Write:       false,
		Target:      api.ES2022,
		Sourcemap:   api.SourceMapInline,
	})

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

		return []byte(fmt.Sprintf("console.error(`JS Build Error:\\n%s`);", errMsg))
	}

	if len(result.OutputFiles) > 1 {
		log.Printf("several js files?")
		for _, file := range result.OutputFiles {
			fmt.Printf("Output file: %s\n", file.Path)
		}
	}
	return result.OutputFiles[0].Contents
}

func ParseCSS() []byte {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"./web-gui/style/bundle.css"},
		Bundle:      true,
		Write:       false,
		Sourcemap:   api.SourceMapInline,
		External:    []string{"*.svg", "*.ttf"},
	})

	if len(result.Errors) > 0 {
		var errMsg string
		for _, buildErr := range result.Errors {

			errMsg += fmt.Sprintf("❌ %s\\A", buildErr.Text)
			if buildErr.Location != nil {
				errMsg += fmt.Sprintf("   at %s:%d:%d\\A",
					buildErr.Location.File,
					buildErr.Location.Line,
					buildErr.Location.Column,
				)
			}
		}

		cleanMsg := strings.ReplaceAll(errMsg, `"`, "'")

		cssErrorResponse := fmt.Sprintf(`
body::before {
    content: "⚠️ CSS BUILD ERROR:\A %s";
    white-space: pre-wrap;
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 999999 !important;
    padding: 15px !important;
    background: #8b0000 !important;
    color: #ffffff !important;
    font-family: monospace !important;
    font-size: 14px !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
}
`, cleanMsg)

		return []byte(cssErrorResponse)
	}

	if len(result.OutputFiles) > 1 {
		log.Printf("several css files?")
		for _, file := range result.OutputFiles {
			fmt.Printf("Output file: %s\n", file.Path)
		}
	}
	return result.OutputFiles[0].Contents
}

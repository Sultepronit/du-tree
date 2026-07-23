package embeded

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed dist
var embedFS embed.FS

func GetSubFSHandler() http.Handler {
	subFS, err := fs.Sub(embedFS, "dist")
	if err != nil {
		panic("subFS error: " + err.Error())
	}

	return http.FileServer(http.FS(subFS))
}

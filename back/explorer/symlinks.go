package explorer

import (
	"log"
	"os"
	"path/filepath"
)

func getRealEntity(path string, name string) (typ string, realPath string) {
	fullPath := path + "/" + name
	realPath, err := filepath.EvalSymlinks(fullPath)
	if err == nil {
		info, err := os.Stat(realPath)
		if err != nil {
			log.Println(err)
			return "", ""
		}
		return info.Mode().Type().String()[0:1], realPath
	} else {
		log.Println(err)
	}

	target, err := os.Readlink(fullPath)
	if err != nil {
		return "brk", "?"
	}

	return "brk", target
}

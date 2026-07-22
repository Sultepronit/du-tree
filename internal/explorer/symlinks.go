package explorer

import (
	"log"
	"os"
	"path/filepath"
)

func GetLinkInfo(path string, name string) (typ string, linkTo string) {
	fullPath := filepath.Join(path, name)
	target, err := os.Readlink(fullPath)
	if err != nil {
		if os.IsPermission(err) {
			return "perm-file", "?"
		}

		log.Println("symlinks/Readlink:", err)
		return "brk", "?"
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		if os.IsPermission(err) {
			return "perm-target", target
		}

		if !os.IsNotExist(err) {
			log.Println("symlinks/Stat:", err)
		}

		return "brk", target
	}

	// return "brk", target
	return info.Mode().Type().String()[0:1], target
}

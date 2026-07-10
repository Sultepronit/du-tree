package explorer

import (
	"log"
	"os"
	"path/filepath"
)

func GetRealEntity(path string, name string) (typ string, realPath string) {
	fullPath := path + "/" + name
	target, err := os.Readlink(fullPath)
	if err != nil {
		return "brk", "?"
	}

	realPath, err = filepath.EvalSymlinks(fullPath)
	if err == nil {
		info, err := os.Stat(realPath)
		if err != nil {
			log.Println(err)
			return "", ""
		}
		// return info.Mode().Type().String()[0:1], realPath
		return info.Mode().Type().String()[0:1], target
	}
	// no such file or directory

	// target, err := os.Readlink(fullPath)
	// if err != nil {
	// 	return "brk", "?"
	// }

	return "brk", target
}

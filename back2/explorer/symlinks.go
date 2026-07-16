package explorer

import (
	"log"
	"os"
	"path/filepath"
)

func GetRealEntity(path string, name string) (typ string, realPath string) {
	fullPath := filepath.Join(path, name)
	target, err := os.Readlink(fullPath)
	if err != nil {
		if os.IsPermission(err) {
			return "perm", "?"
		}

		log.Println("symlinks/Readlink:", err)
		return "brk", "?"
	}

	// realPath, err = filepath.EvalSymlinks(fullPath)
	// if err == nil {
	// 	info, err := os.Stat(realPath)
	// 	info2, err := os.Stat(fullPath)
	// 	fmt.Println(info.Mode(), info2.Mode())
	// 	if err != nil {
	// 		log.Println(err)
	// 		return "", ""
	// 	}
	// 	return info.Mode().Type().String()[0:1], target
	// }
	// no such file or directory

	info, err := os.Stat(fullPath)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Println("symlinks/Stat:", err)
		}
		return "brk", target
	}

	// return "brk", target
	return info.Mode().Type().String()[0:1], target
}

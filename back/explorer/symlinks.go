package explorer

import (
	"log"
	"os"
	"path/filepath"
)

func getRealEntity(path string, name string) (typ string, realPath string) {
	realPath, err := filepath.EvalSymlinks(path + "/" + name)
	if err == nil {
		info, err := os.Stat(realPath)
		if err != nil {
			return "", ""
		}
		return info.Mode().Type().String()[0:1], realPath
		// if err == nil && info.IsDir() {
		// 	fmt.Println(name, "->", realPath)
		// 	return "*"+name+"*"+realPath
		// }
	} else {
		log.Println(err)
	}

	return "", ""
}

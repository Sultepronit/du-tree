package explorer

import (
	"du-tree/models"
	"fmt"
	"os"
	"path/filepath"
)

func CheckPath(path string) *models.Path {
	fmt.Println("path:", path)
	// filepath.Clean()?
	// fmt.Println(filepath.Clean(path))
	// if filepath.Clean(path) + "/" != path {
	// 	return nil
	// }

	re := models.Path{
		Current: "ok",
		Next:    make([]string, 0, 5),
	}

	for i := range 100 {
		// fmt.Println(i)
		entries, err := os.ReadDir(path)
		if err == nil {
			// fmt.Println(filepath.Clean(path))
			// if filepath.Clean(path) + "/" != path {
			// 	return nil
			// }

			if i > 0 {
				re.Current = path
			}
			// fmt.Println("here?")
			for _, e := range entries {
				// fmt.Println("here!")
				// fmt.Println("p:", e.Name())
				if e.IsDir() {
					re.Next = append(re.Next, e.Name())
				} else if e.Type().String()[0:1] == "L" {
					typ, realPath := getRealEntity(path, e.Name())
					if typ == "d" {
						re.Next = append(re.Next, "///"+e.Name()+"///"+realPath)
					}
				}

			}
			return &re
		}

		fmt.Println("err:", err)

		// path = filepath.Dir(path)
		prev := filepath.Dir(path)
		if (prev[0] != path[0]) {
			return nil
		}

		path = prev
	}

	return nil
}

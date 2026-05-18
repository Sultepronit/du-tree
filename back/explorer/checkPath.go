package explorer

import (
	"du-tree/models"
	"fmt"
	"os"
	"path/filepath"
)

// func CheckPath(path string) string {
func CheckPath0(path string) any {
	// filepath.Clean()?

	fmt.Println("path:", path)
	entries, err := os.ReadDir(path)
	if err == nil {
		fmt.Println("ok", entries)
		// return "ok"
		// return entries
		re := make([]string, 0, 5)
		for _, e := range entries {
			if e.IsDir() {
				re = append(re, e.Name())
			}

		}
		return re
	}

	fmt.Println("err:", err)

	parentPath := filepath.Dir(path)

	// if parentPath == path {
	// 	fmt.Println("wrong path!")
	// 	return "wrong path!"
	// }

	return CheckPath0(parentPath)
}

func CheckPath(path string) any {
	fmt.Println("path:", path)
	// filepath.Clean()?

	re := models.Path{
		Current: "ok",
		Next:    make([]string, 0, 5),
	}

	for i := range 100 {
		// fmt.Println(i)
		entries, err := os.ReadDir(path)
		if err == nil {
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
					// re.Next = append(re.Next, "*"+e.Name())
					realPath, err := filepath.EvalSymlinks(path + "/" + e.Name())
					if err == nil {

						info, err := os.Stat(realPath)
						if err == nil && info.IsDir() {
							fmt.Println(e.Name(), "->", realPath)
							re.Next = append(re.Next, "*"+e.Name()+"*"+realPath)
						}
					}
				}

			}
			return &re
		}

		fmt.Println("err:", err)

		path = filepath.Dir(path)
	}

	return nil
}

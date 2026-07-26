package explorer

import (
	"du-tree/internal/models"
	"errors"
	"fmt"
	"strings"

	"os"
	"path/filepath"
)

// if path[0] == '~' {
// 	if len(path) > 1 && path[1] != '/' {
// 		return nil
// 	}

// 	home, err := os.UserHomeDir()
// 	if err != nil {
// 		fmt.Println("checkPath:", err)
// 	} else {
// 		if path == "~" || path == "~/" {
// 			path = home + "/"
// 		}
// 		path = filepath.Join(home, path[1:])
// 	}
// }

func stepBack(path string) string {
	fmt.Println("path1:", path)
	// abs, err := filepath.Abs(path)
	// fmt.Println("abs:", abs, err)
	prev := filepath.Dir(path)

	fmt.Println(path, prev, filepath.Base(path))

	if prev[0] != path[0] && filepath.Clean(path)[0] != filepath.Clean(prev)[0] {
		fmt.Println(filepath.Clean(path), filepath.Clean(prev))
		return ""
	}

	return prev
}

func CheckPath(path string) *models.Path {
	fmt.Println("path0:", path)
	re := models.Path{
		Current: "ok",
		Next:    make([]models.PathDetail, 0, 5),
	}

	// fmt.Println("path:", path)
	// filepath.Clean()?

	// if strings.Contains(path, "/") && path[len(path)-1] != '/' {
	// if strings.LastIndex(path, "/") != len(path)-1 {
	// 	path = filepath.Dir(path)
	// }

	if !(strings.HasSuffix(path, "/") || strings.HasSuffix(path, ".")) {
		if IsAccessible(path, "") {
			path = stepBack(path)
			if path == "" {
				return nil
			}
		}

	}

	for i := range 100 {
		entries, err := os.ReadDir(path)
		if err != nil {
			if errors.Is(err, os.ErrPermission) {
				re.Current = "Permission denied"
				return &re
			}
			// fmt.Println("err:", err)
		} else {
			if i > 0 {
				re.Current = path
			}

			for _, e := range entries {
				if e.IsDir() {
					next := models.PathDetail{Name: e.Name()}
					if !IsAccessible(path, e.Name()) {
						next.IsLocked = true
					}
					re.Next = append(re.Next, next)

				} else if e.Type().String()[0:1] == "L" {
					typ, linkTo := GetLinkInfo(path, e.Name())
					if typ == "d" {
						next := models.PathDetail{Name: e.Name(), Link: linkTo}

						if !IsAccessible(path, e.Name()) {
							next.IsLocked = true
						}
						re.Next = append(re.Next, next)
					}
				}
			}
			return &re
		}

		// prev := filepath.Dir(path)
		// // fmt.Println(path, prev)

		// if prev[0] != path[0] && filepath.Clean(path)[0] != filepath.Clean(prev)[0] {
		// 	fmt.Println(filepath.Clean(path), filepath.Clean(prev))
		// 	return nil
		// }

		// path = prev
		path = stepBack(path)
		if path == "" {
			return nil
		}
	}

	return nil
}

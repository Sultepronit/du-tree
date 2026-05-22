package explorer

import (
	"du-tree/models"
	"errors"
	"fmt"

	"os"
	"path/filepath"

	"golang.org/x/sys/unix"
)

func checkAccess(path string, name string) bool {
	fullP := filepath.Join(path, name)
	err := unix.Access(fullP, unix.R_OK|unix.X_OK)
	return err == nil
}

func CheckPath(path string) *models.Path {
	fmt.Println("path:", path)
	// filepath.Clean()?

	re := models.Path{
		Current: "ok",
		Next:    make([]string, 0, 5),
	}

	for i := range 100 {
		entries, err := os.ReadDir(path)
		if err != nil {
			if errors.Is(err, os.ErrPermission) {
				// re.Next = append(re.Next, "Presmission denied")
				re.Current = "Permission denied"
				return &re
			}
			fmt.Println("err:", err)
		} else {
			if i > 0 {
				re.Current = path
			}

			for _, e := range entries {
				if e.IsDir() {
					fullP := filepath.Join(path, e.Name())
					err := unix.Access(fullP, unix.R_OK|unix.X_OK)
					if err != nil {
						re.Next = append(re.Next, "/🔒"+e.Name())
					} else {
						re.Next = append(re.Next, e.Name())
					}

				} else if e.Type().String()[0:1] == "L" {
					typ, realPath := getRealEntity(path, e.Name())
					if typ == "d" {
						acc := checkAccess(realPath, "")
						if acc {
							re.Next = append(re.Next, "///"+e.Name()+"///"+realPath)
						} else {
							re.Next = append(re.Next, "///🔒/"+e.Name()+"///"+realPath)
						}

					}
				}

			}
			return &re
		}

		// path = filepath.Dir(path)
		prev := filepath.Dir(path)
		if prev[0] != path[0] {
			return nil
		}

		path = prev
	}

	return nil
}

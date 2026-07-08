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
		// Next:    make([]string, 0, 5),
		Next: make([]models.PathDetail, 0, 5),
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
					next := models.PathDetail{Name: e.Name()}
					if !checkAccess(path, e.Name()) {
						next.IsLocked = true
					}
					re.Next = append(re.Next, next)

				} else if e.Type().String()[0:1] == "L" {
					typ, realPath := getRealEntity(path, e.Name())
					if typ == "d" {
						next := models.PathDetail{Name: e.Name(), Link: realPath}
						if !checkAccess(realPath, "") {
							next.IsLocked = true
						}
						re.Next = append(re.Next, next)
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

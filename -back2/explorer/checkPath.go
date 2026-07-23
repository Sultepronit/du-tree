package explorer

import (
	"du-tree/models"
	"errors"

	"os"
	"path/filepath"
)

func CheckPath(path string) *models.Path {
	// fmt.Println("path:", path)
	// filepath.Clean()?

	re := models.Path{
		Current: "ok",
		Next:    make([]models.PathDetail, 0, 5),
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
						// if !IsAccessible(realPath, "") {
						if !IsAccessible(path, e.Name()) {
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

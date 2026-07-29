package explorer

import (
	"du-tree/internal/models"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func unwrapPath(path string) string {
	if strings.HasPrefix(path, "~") {
		home, err := os.UserHomeDir()
		if err != nil {
			fmt.Println("Home dir not found:", err)
		} else if path == "~" || strings.HasPrefix(path, "~/") {
			return filepath.Join(home, path[1:])
		}
	}

	abs, err := filepath.Abs(path)
	if err != nil {
		fmt.Println("Impossible absolute path:", err)
		return path
	}

	return abs
}

func prepSuggestions(entries []os.DirEntry, path string) []models.PathDetail {
	re := make([]models.PathDetail, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() {
			next := models.PathDetail{Name: e.Name()}
			if !IsAccessible(path, e.Name()) {
				next.IsLocked = true
			}
			re = append(re, next)

		} else if e.Type().String()[0:1] == "L" {
			typ, linkTo := GetLinkInfo(path, e.Name())
			if typ == "d" {
				next := models.PathDetail{Name: e.Name(), Link: linkTo}

				if !IsAccessible(path, e.Name()) {
					next.IsLocked = true
				}
				re = append(re, next)
			}
		}
	}
	return re
}

// func getDiffPrefix(a, b string) (prefixA, prefixB string) {
func getDiffPrefix(a, b string) []string {
	if a == b {
		// return []string{"", ""}
		return nil
	}
	i := len(a) - 1
	j := len(b) - 1

	for i >= 0 && j >= 0 && a[i] == b[j] {
		i--
		j--
	}

	return []string{a[:i+1], b[:j+1]}
}

func cleanSlash(input string) string {
	if input == "/" {
		return "/"
	}
	re, _ := strings.CutSuffix(input, "/")
	return re
}

func CheckPath2(inputPath string) *models.Path {
	// fmt.Println("path:", inputPath)
	re := models.Path{
		InputPath: inputPath,
		NextDirs:  make([]models.PathDetail, 0, 5),
	}

	improved := unwrapPath(inputPath)
	// fmt.Println("improved:", improved)

	cleanInput := cleanSlash(inputPath)
	re.Replacement = getDiffPrefix(cleanInput, improved)

	// for the case when last dir's name may be a part of another one
	workingPath := improved
	if filepath.Base(inputPath) == filepath.Base(improved) && !strings.HasSuffix(inputPath, "/") {
		workingPath = filepath.Dir(improved)
	}
	// fmt.Println("working:", workingPath)
	if workingPath != cleanInput {
		re.WorkingPath = workingPath
	}

	for range 100 {
		entries, err := os.ReadDir(workingPath)
		if err != nil {
			if os.IsPermission(err) {
				re.IsLocked = true
				return &re
			}
			fmt.Println(err)

			workingPath = filepath.Dir(workingPath)
			re.WorkingPath = workingPath
			continue
		}

		re.NextDirs = prepSuggestions(entries, workingPath)
		break
	}

	return &re
}

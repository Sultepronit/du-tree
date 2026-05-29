package du

import (
	"du-tree/explorer"
	"du-tree/models"
	"strings"
)

// var updatePaths = make(map[string]bool)
// var updatePaths = make([]string, 0, 3)
// var updatePaths []string

func genfSizePath(basePath []string) []string {
	if len(basePath) == 1 && basePath[0] == "" {
		// updatePaths = make([]string, 0, 3)
		return []string{"*files"}
	}
	fSizePath := make([]string, len(basePath)+1)
	copy(fSizePath, basePath)
	fSizePath[len(basePath)] = "*files"
	return fSizePath
}

// func GetDir(path string) ([]*models.Node, error) {
func GetDir(path string) (*models.Node, error) {
	baceCont, err := explorer.ReadDir(path)
	if err != nil {
		return nil, err
	}

	// log.Println(path)
	var fSize int64
	for _, n := range baceCont {
		// fmt.Println(n.Size)
		fSize += n.Size
	}
	// log.Println(fSize)

	allParts := strings.Split(path, "/")
	parts := allParts[discardIndex:]

	fSizePath := genfSizePath(parts)
	// log.Println(fSizePath)
	tree.fill(fSizePath, fSize)

	// updatePaths[strings.Join(parts, "/")] = true
	// updatePaths = append(updatePaths, strings.Join(parts, "/"))
	// fmt.Println(updatePaths)

	dure := tree.getDir(strings.Join(parts, "/"))
	// log.Println("du.GetDir: dure", dure)

	if dure == nil {
		return &models.Node{
			Size:       0,
			SizeIsTemp: true,
			Content:    baceCont,
		}, nil
	}

	dureCont := make(map[string]*models.Node, len(dure.Content))
	for _, n := range dure.Content {
		dureCont[n.Name] = n
	}
	// fmt.Println(dureCont)

	for i, n := range baceCont {
		if u, found := dureCont[n.Name]; found {
			baceCont[i] = u
		}
	}

	dure.Content = baceCont

	// return baceCont, nil
	return dure, nil
}

// func GetUpdate() *models.Node {
// func GetUpdate() []*models.Node {
func GetUpdate(reqPaths []string) []*models.Node {
	// re := make([]*models.Node, len(updatePaths))
	re := make([]*models.Node, len(reqPaths)+1)
	// updatePaths := make([]string, 0, len(reqPaths)+1)
	// updatePaths[0] = "",
	// updatePaths = append(updatePaths, )
	re[0] = tree.getDir("")
	// for i, p := range updatePaths {
	for i, p := range reqPaths {
		// fmt.Println(p)
		re[i+1] = tree.getDir(p)
	}

	return re
}

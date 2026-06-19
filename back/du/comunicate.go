package du

import (
	"du-tree/explorer"
	"du-tree/helpers"
	"du-tree/models"
	"sort"
	"strings"
)

func genfSizePath(basePath []string) []string {
	if len(basePath) == 1 && basePath[0] == "" {
		return []string{"*files"}
	}
	fSizePath := make([]string, len(basePath)+1)
	copy(fSizePath, basePath)
	fSizePath[len(basePath)] = "*files"
	return fSizePath
}

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

	dure := tree.getDir(strings.Join(parts, "/"))
	// log.Println("du.GetDir: dure", dure)

	// no need?
	// if dure == nil {
	// 	return &models.Node{
	// 		Size:       0,
	// 		SizeIsTemp: true,
	// 		Content:    baceCont,
	// 	}, nil
	// }

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

	sort.Slice(baceCont, func(i, j int) bool {
		return baceCont[i].Size > baceCont[j].Size
	})

	// dure.Content = baceCont[:100]
	// dure.Content = helpers.LimitSlice(baceCont, 100)
	if len(baceCont) > 100 {
		dure.Content = baceCont[:100]
		dure.ContentCount = len(baceCont)
	} else {
		dure.Content = baceCont
	}

	return dure, nil
}

func checkCancel() bool {
	tree.mu.RLock()
	defer tree.mu.RUnlock()
	if tree.root == nil {
		return true
	}
	return tree.cancel == nil && tree.root.Temp
}

// func GetUpdate() *models.Node {
// func GetUpdate() []*models.Node {
func GetUpdate0(reqPaths []string) []*models.Node {
	if checkCancel() {
		return nil
	}
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

func GetUpdate(reqPaths []string) []*models.Node {
	if checkCancel() {
		return nil
	}

	updatePaths := append([]string{""}, reqPaths...)
	re := make([]*models.Node, len(updatePaths))
	re[0] = tree.getDir("")
	for i, p := range updatePaths {
		// fmt.Println(p)
		// re[i] = tree.getDir(p)
		re[i] = tree.getDir(p)

		sort.Slice(re[i].Content, func(a, b int) bool {
			return re[i].Content[a].Size > re[i].Content[b].Size
		})

		// re[i].Content = re[i].Content[:100]
		re[i].Content = helpers.LimitSlice(re[i].Content, 100)
	}

	return re
}

package du

import (
	"cmp"
	"du-tree/explorer"
	"du-tree/helpers"
	"du-tree/models"
	"slices"
	"strings"
)

func sortContent(nodes []*models.Node) {
	slices.SortFunc(nodes, func(a, b *models.Node) int {
		if a.Size != b.Size {
			return cmp.Compare(b.Size, a.Size)
		}
		return cmp.Compare(a.Name, b.Name)
	})
}

func genfSizePath(basePath []string) []string {
	if len(basePath) == 1 && basePath[0] == "" {
		return []string{"*files"}
	}
	fSizePath := make([]string, len(basePath)+1)
	copy(fSizePath, basePath)
	fSizePath[len(basePath)] = "*files"
	return fSizePath
}

var pageSize = 100

func GetDir(path string, pages int) (*models.Node, error) {
	tree.mu.RLock()
	baceCont, err := explorer.ReadDir(path, tree.getBlockSize)
	tree.mu.RUnlock()

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

	if fSize > 0 {
		fSizePath := genfSizePath(parts)
		tree.fill(fSizePath, fSize)
	}

	dure := tree.getDir(strings.Join(parts, "/"))
	// log.Println("du.GetDir: dure", dure)

	if dure == nil {
		dure = &models.Node{
			Size:       fSize,
			SizeIsTemp: true,
			Content:    []*models.Node{},
		}
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

	// sort.Slice(baceCont, func(i, j int) bool {
	// 	return baceCont[i].Size > baceCont[j].Size
	// })
	sortContent(baceCont)

	contLen := pageSize * pages
	if len(baceCont) > contLen {
		dure.Content = baceCont[:contLen]
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

func GetUpdate(req []models.Request) []*models.Node {
	if checkCancel() {
		return nil
	}

	re := make([]*models.Node, len(req))
	for i, r := range req {
		re[i] = tree.getDir(r.Path)
		re[i].Name = r.Path

		// sort.Slice(re[i].Content, func(a, b int) bool {
		// 	return re[i].Content[a].Size > re[i].Content[b].Size
		// })

		sortContent(re[i].Content)

		re[i].Content = helpers.LimitSlice(re[i].Content, pageSize*r.Pages)

		// slices.SortFunc(re[i].Content, func(a, b *models.Node) int {
		// 	return cmp.Compare(a.Name, b.Name)
		// })
	}

	return re
}

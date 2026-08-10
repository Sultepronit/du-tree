package scanner

import (
	"du-tree/internal/models"
)

func prepareViewDirs(times map[string]int64, node *viewNode) {
	if len(times) == 0 {
		return
	}

	node.ViewDirs = make([]viewDir, len(node.Dirs))
	data.scanMu.RLock()
	defer data.scanMu.RUnlock()
	for i, d := range node.Dirs {
		node.ViewDirs[i] = viewDir{dirNode: d, ModTime: times[d.Name]}
	}
}

func parseDirNode(node *dirNode) *models.Node {
	return &models.Node{
		Name:     node.Name,
		Size:     node.Size,
		Type:     "d",
		ScanTime: node.ScanTime,
		Locked:   node.Locked,
		Temp:     node.Temp,
	}
}

func parseViewDir(node viewDir) *models.Node {
	return &models.Node{
		Name:     node.Name,
		Size:     node.Size,
		Type:     "d",
		ModTime:  node.ModTime,
		ScanTime: node.ScanTime,
		Locked:   node.Locked,
		Temp:     node.Temp,
	}
}

func parseFileNode(node *fileNode) *models.Node {
	return &models.Node{
		Name:        node.Name,
		Size:        node.Size,
		Type:        node.Type,
		ModTime:     node.ModTime,
		ScanTime:    node.ScanTime,
		LinkPath:    node.LinkPath,
		Nlink:       node.Nlink,
		IsNeglected: node.IsHardlink,
	}
}

func parseViewNode(branch *viewNode, includeFiles bool) *models.Node {
	data.scanMu.RLock()
	defer data.scanMu.RUnlock()
	// re := parseDirNode(branch.dirNode)
	re := parseDirNode(branch.dirNode)
	re.Content = make([]*models.Node, 0, 10)

	// to avoid interfering with the scanning!!!
	// helpers.SortBySizeThenName(branch.Dirs)

	// for _, n := range branch.Dirs {
	for _, n := range branch.ViewDirs {
		re.Content = append(re.Content, parseViewDir(n))
	}
	// data.scanMu.RUnlock()

	if includeFiles {
		for _, n := range branch.Files {
			re.Content = append(re.Content, parseFileNode(n))
		}
	}

	return re
}

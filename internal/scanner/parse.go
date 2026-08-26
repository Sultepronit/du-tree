package scanner

import (
	"du-tree/internal/models"
	"log"
)

func prepareViewDirs(times map[string]int64, node *viewNode) {
	// if len(times) == 0 {
	// 	return
	// }

	node.ViewDirs = make([]viewDir, len(node.Dirs))
	data.scanMu.RLock()
	defer data.scanMu.RUnlock()
	for i, d := range node.Dirs {
		t, ok := times[d.Name]
		if !ok {
			log.Println("No mod time for:", d.Name)
		}
		// node.ViewDirs[i] = viewDir{dirNode: d, ModTime: times[d.Name]}
		node.ViewDirs[i] = viewDir{dirNode: d, ModTime: t}
	}
}

func parseBranchHead(node *dirNode) *models.Branch {
	return &models.Branch{
		Name: node.Name,
		Size: node.Size,
		// ScanTime: node.ScanTime,
		Locked: node.Locked,
		Temp:   node.Temp,
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

// func parseBranch(branch *viewNode, includeFiles bool) *models.Node {
func parseBranch(branch *viewNode, includeFiles bool) *models.Branch {
	data.scanMu.RLock()
	defer data.scanMu.RUnlock()
	re := parseBranchHead(branch.dirNode)
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

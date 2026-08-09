package scanner

import (
	"du-tree/internal/models"
)

func parseDirNode(node *dirNode) *models.Node {
	return &models.Node{
		Name:   node.Name,
		Size:   node.Size,
		Type:   "d",
		Locked: node.Locked,
		Temp:   node.Temp,
	}
}

func parseFileNode(node *fileNode) *models.Node {
	return &models.Node{
		Name:        node.Name,
		Size:        node.Size,
		Type:        node.Type,
		LinkPath:    node.LinkPath,
		Nlink:       node.Nlink,
		IsNeglected: node.IsHardlink,
	}
}

func parseViewNode(branch *viewNode, includeFiles bool) *models.Node {
	data.scanMu.RLock()
	re := parseDirNode(branch.dirNode)
	re.Content = make([]*models.Node, 0, 10)

	// to avoid interfering with the scanning!!!
	// helpers.SortBySizeThenName(branch.Dirs)

	for _, n := range branch.Dirs {
		re.Content = append(re.Content, parseDirNode(n))
	}
	data.scanMu.RUnlock()

	if includeFiles {
		for _, n := range branch.Files {
			re.Content = append(re.Content, parseFileNode(n))
		}
	}

	return re
}

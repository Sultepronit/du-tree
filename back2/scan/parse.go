package scan

import "du-tree/models"

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

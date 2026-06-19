package explorer

import (
	"du-tree/models"
	"os"
)

func ReadDir(path string) ([]*models.Node, error) {
	re := make([]*models.Node, 0, 10)
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	for _, e := range entries {
		var node models.Node
		re = append(re, &node)
		node.Name = e.Name()
		node.Type = e.Type().String()[0:1]
		if e.IsDir() {
			node.SizeIsTemp = true
			continue
		} else if node.Type == "L" {
			typ, realPath := getRealEntity(path, node.Name)
			// node.Name += "/" + typ + "/" + realPath
			node.Type += typ
			// node.Name += "/" + realPath
			node.LinkPath = realPath
		}
		info, err := e.Info()
		if err != nil {
			return nil, err
		}
		node.Size = info.Size()
	}

	return re, nil
}

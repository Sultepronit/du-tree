package du

import (
	"du-tree/models"
)

func transformNode(raw *rawNode, name string) models.Node {
	return models.Node{
		Name:       name,
		Type:       "d",
		Size:       raw.getSize(),
		SizeIsTemp: raw.Temp,
		Locked:     raw.Locked,
	}
}

func parseNode(raw *rawNode, name string) models.Node {
	node := transformNode(raw, name)
	// fmt.Println(name, raw)

	node.Content = make([]*models.Node, 0, len(raw.Content))

	for cn, cr := range raw.Content {
		// fmt.Println(cn)
		if cn == "*files" {
			continue
		}
		cn := transformNode(cr, cn)
		node.Content = append(node.Content, &cn)
	}

	// sort.Slice(node.Content, func(i, j int) bool {
	// 	return node.Content[i].Size > node.Content[j].Size
	// })

	return node
}

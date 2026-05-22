package du

import (
	"du-tree/models"
)

func transformNode(raw *rawNode, name string) models.Node {
	// t := "d"
	// if raw.Locked {
	// 	t = "-locked"
	// }
	return models.Node{
		Name: name,
		Type: "d",
		// Type: t,
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

	return node
}

package du

import (
	"du-tree/models"
)

func transformNode(raw *rawNode, name string) models.Node {
	return models.Node{
		Name: name,
		Type: "d",
		// Size:       raw.Size,
		Size:       raw.getSize(),
		SizeIsTemp: raw.Temp,
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

// func getDir(path string) models.Node {
// 	parts := strings.Split(path, "/")
// 	target := tree
// 	// log.Println(target)
// 	for _, br := range parts {
// 		if br == "" {
// 			continue
// 		}
// 		target = target.Content[br]
// 	}
// 	// log.Println(parts)
// 	// log.Println(len(parts))
// 	// log.Println(parts[0])
// 	// log.Println(parts[len(parts)-1])
// 	// log.Println(target)
// 	re := parseNode(target, parts[len(parts)-1])
// 	// re := parseNode(target, "parts[len(parts)-1]")
// 	// prinAsJson(re)
// 	return re
// }

func parseNodeContent(raw *rawNode) []*models.Node {
	re := make([]*models.Node, 0, len(raw.Content))
	for name, cont := range raw.Content {
		re = append(re, &models.Node{
			Name:       name,
			Type:       "d",
			Size:       cont.Size,
			SizeIsTemp: cont.Temp,
		})
	}

	// sort.Slice(children, func(i, j int) bool {
	// 	return children[i].Size > children[j].Size
	// })

	return re
}

// func getCachedBranch(branches []string) []*models.Node {
// 	target := tree
// 	for _, br := range branches {
// 		target = target.Content[br]
// 	}
// 	re := parseNodeContent(target)
// 	// prinAsJson(re)
// 	return re
// }

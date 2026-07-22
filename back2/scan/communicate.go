package scan

import (
	"du-tree/helpers"
	"du-tree/models"
	"fmt"
	"strings"
)

// func sortContent(nodes []*models.Node) {
// 	slices.SortFunc(nodes, func(a, b *models.Node) int {
// 		if a.Size == b.Size {
// 			return cmp.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
// 		}
// 		return cmp.Compare(b.Size, a.Size)
// 	})
// }

func getBranch(path string) *viewNode {
	parts := strings.Split(path, "/")
	target := data.viewTree

	for _, name := range parts {
		fmt.Println(name)
		if next, prs := target.Branches[name]; prs {
			target = next
		} else {
			for _, dir := range target.Dirs {
				if dir.Name == name {
					if target.Branches == nil {
						target.Branches = make(map[string]*viewNode)
					}
					target.Branches[name] = &viewNode{
						dirNode: dir,
					}
					target = target.Branches[name]
					break
				}
			}
		}
	}
	return target
}

var pageSize = 100

func GetDir(path string, pages int) (*models.Node, error) {
	data.mu.Lock()
	req := data.request

	branch := getBranch(path)

	if branch.Files == nil {
		files, err := getFiles(req.Path+path, req.Options.BlockSize)
		if err != nil {
			data.mu.Unlock()
			return nil, err
		}
		branch.Files = files
	}

	// re := parseDirNode(branch.dirNode)
	// re.Content = make([]*models.Node, 0, pageSize*pages)
	// for _, n := range branch.Dirs {
	// 	re.Content = append(re.Content, parseDirNode(n))
	// }
	// for _, n := range branch.Files {
	// 	re.Content = append(re.Content, parseFileNode(n))
	// }
	re := parseViewNode(branch, true)
	data.mu.Unlock()

	// sortContent(re.Content)
	helpers.SortBySizeThenName(re.Content)

	contLen := pageSize * pages
	if len(re.Content) > contLen {
		re.ContentCount = len(re.Content)
		re.Content = re.Content[:contLen]
	}

	return re, nil
}

func checkCanceled() bool {
	if data.scanTree == nil {
		return true
	}
	return data.cancel == nil && data.scanTree.Temp != 0
}

func GetUpdate(req []models.Request) []*models.Node {
	re := make([]*models.Node, len(req))

	data.mu.Lock()
	defer data.mu.Unlock()

	if checkCanceled() {
		return nil
	}

	for i, r := range req {
		b := getBranch(r.Path)
		// re[i] = parseDirNode(b.dirNode)
		// re[i].Name = r.Path
		// for _, n := range b.Dirs {
		// 	re[i].Content = append(re[i].Content, parseDirNode(n))
		// }
		// sortContent(re[i].Content)
		re[i] = parseViewNode(b, false)
		re[i].Name = r.Path

		re[i].Content = helpers.LimitSlice(re[i].Content, pageSize*r.Pages)
	}

	return re
}

func GetState() models.Request {
	data.mu.RLock()
	defer data.mu.RUnlock()
	return data.request
}

package scan

import (
	"cmp"
	"du-tree/models"
	"fmt"
	"slices"
	"strings"
)

func sortContent(nodes []*models.Node) {
	slices.SortFunc(nodes, func(a, b *models.Node) int {
		if a.Size == b.Size {
			return cmp.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
		}
		return cmp.Compare(b.Size, a.Size)
	})
}

func getBranch(path string) (*viewNode, error) {
	parts := strings.Split(path, "/")
	// data.mu.Lock()
	// defer data.mu.Unlock()
	target := data.viewTree

	if target == nil {
		data.viewTree = &viewNode{dirNode: data.scanTree}
		return data.viewTree, nil
	}

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
	return target, nil
}

var pageSize = 100

func GetDir(path string, pages int) (*models.Node, error) {
	data.mu.Lock()
	request := data.request

	branch, err := getBranch(path)
	if err != nil {
		return nil, err
	}

	if branch.Files == nil {
		files, err := getFiles(request.Path+path, true)
		if err != nil {
			return nil, err
		}
		branch.Files = files
	}

	re := parseDirNode(branch.dirNode)
	re.Content = make([]*models.Node, 0, pageSize*pages)
	for _, n := range branch.Dirs {
		re.Content = append(re.Content, parseDirNode(n))
	}
	for _, n := range branch.Files {
		re.Content = append(re.Content, parseFileNode(n))
	}
	data.mu.Unlock()

	sortContent(re.Content)

	return re, nil
}

package scanner

import (
	"du-tree/internal/helpers"
	"du-tree/internal/models"
	"errors"
	"strings"
)

func getBranch(path string) *viewNode {
	parts := strings.Split(path, "/")
	target := data.viewTree
	// fmt.Println(target)
	if target == nil {
		return nil
	}

	for _, name := range parts {
		// fmt.Println(name)
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
	if branch == nil {
		data.mu.Unlock()
		return nil, errors.New("the branch does not exist")
	}
	// fmt.Println("branch:", branch)

	if branch.Files == nil {
		// files, err := getFiles(req.Path+path, req.Options.BlockSize)
		files, err := getFiles(req.Path+path, req.Options)
		if err != nil {
			data.mu.Unlock()
			return nil, err
		}
		branch.Files = files
	}

	re := parseViewNode(branch, true)
	data.mu.Unlock()

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

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
			// the parget is parent of the branch we need
			for _, dir := range target.Dirs {
				if dir.Name == name {
					// create branches if not exist
					if target.Branches == nil {
						target.Branches = make(map[string]*viewNode)
					}
					// create the target we need
					target.Branches[name] = &viewNode{
						dirNode: dir,
					}
					// set the target
					target = target.Branches[name]
					break
				}
			}
		}
	}
	return target
}

func PresentDir(path string, req models.Request) (*models.Branch, error) {
	data.viewMu.Lock()
	baseReq := data.request
	branch := getBranch(path)
	if branch == nil {
		data.viewMu.Unlock()
		return nil, errors.New("the branch does not exist")
	}
	// fmt.Println("branch:", branch)

	if branch.Files == nil {
		data.viewMu.Unlock()
		files, dirs, err := getDirCont(baseReq.Path+path, baseReq.Options)
		if err != nil {
			return nil, err
		}
		data.viewMu.Lock()
		branch.Files = files
		prepareViewDirs(dirs, branch)
	}

	res := parseBranch(branch, true)
	data.viewMu.Unlock()

	helpers.SortBySizeThenName(res.Content)

	filterBranchCont(res, req.Limit, req.Filters)

	return res, nil
}

func checkCanceled() bool {
	// data.scanMu.RLock()
	// defer data.scanMu.RUnlock()

	if data.scanTree == nil {
		return true
	}
	return data.cancel == nil && data.scanTree.Temp != 0
}

func GetUpdate(req models.UpdateReq) []*models.Branch {
	re := make([]*models.Branch, len(req.List))

	data.viewMu.Lock()
	defer data.viewMu.Unlock()

	if checkCanceled() {
		return nil
	}

	// for i, r := range req {
	for i, r := range req.List {
		b := getBranch(r.Path)
		// re[i] = parseBranch(b, false)
		re[i] = parseBranch(b, true)
		re[i].Name = r.Path

		helpers.SortBySizeThenName(re[i].Content)

		filterBranchCont(re[i], r.Limit, req.Filters)
	}

	return re
}

func GetState() models.Request {
	data.viewMu.RLock()
	defer data.viewMu.RUnlock()
	return data.request
}

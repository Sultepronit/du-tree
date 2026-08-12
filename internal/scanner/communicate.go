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

// var pageSize = 100

// func PresentDir(path string, pages int) (*models.Node, error) {
// func PresentDir(path string, req models.Request) (*models.Node, error) {
func PresentDir(path string, req models.Request) (*models.Branch, error) {
	// data.scanMu.Lock()
	data.viewMu.Lock()
	// req := data.request
	branch := getBranch(path)
	if branch == nil {
		// data.scanMu.Unlock()
		data.viewMu.Unlock()
		return nil, errors.New("the branch does not exist")
	}
	// fmt.Println("branch:", branch)

	if branch.Files == nil {
		data.viewMu.Unlock()
		// files, err := getDirCont(req.Path+path, req.Options)
		files, dirs, err := getDirCont(req.Path+path, req.Options)
		if err != nil {
			// data.scanMu.Unlock()
			return nil, err
		}
		data.viewMu.Lock()
		branch.Files = files
		prepareViewDirs(dirs, branch)
	}

	res := parseBranch(branch, true)
	// data.scanMu.Unlock()
	data.viewMu.Unlock()

	helpers.SortBySizeThenName(res.Content)

	// contLen := pageSize * pages
	// if len(re.Content) > contLen {
	// 	re.ContentCount = len(re.Content)
	// 	re.Content = re.Content[:contLen]
	// }
	filterBranchCont(res, req)

	return res, nil
}

func checkCanceled() bool {
	data.scanMu.RLock()
	defer data.scanMu.RUnlock()

	if data.scanTree == nil {
		return true
	}
	return data.cancel == nil && data.scanTree.Temp != 0
}

// func GetUpdate(req []models.Request) []*models.Node {
func GetUpdate(req []models.Request) []*models.Branch {
	// re := make([]*models.Node, len(req))
	re := make([]*models.Branch, len(req))

	// data.scanMu.Lock()
	// defer data.scanMu.Unlock()

	if checkCanceled() {
		return nil
	}

	data.viewMu.Lock()
	defer data.viewMu.Unlock()

	for i, r := range req {
		b := getBranch(r.Path)
		re[i] = parseBranch(b, false)
		re[i].Name = r.Path

		re[i].Content = helpers.LimitSlice(re[i].Content, pageSize*r.Pages)
	}

	return re
}

func GetState() models.Request {
	// data.scanMu.RLock()
	// defer data.scanMu.RUnlock()
	data.viewMu.RLock()
	defer data.viewMu.RUnlock()
	return data.request
}

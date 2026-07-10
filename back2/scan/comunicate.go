package scan

import (
	"du-tree/models"
	"fmt"
	"strings"
)

// func getBranch(path []string) *viewNode {
func getBranch(path string, prePath string) (*viewNode, error) {
	parts := strings.Split(path, "/")
	data.mu.Lock()
	defer data.mu.Unlock()
	// fmt.Println(path, path[0])
	target := data.viewTree
	fmt.Println("target 0:", target)
	// if path == nil {
	// 	return target
	// }
	if target == nil {
		files, err := getFiles(prePath+path, true)
		if err != nil {
			return nil, err
		}

		data.viewTree = &viewNode{
			dirNode: data.scanTree,
			Files:   files,
		}

		return data.viewTree, nil
	}

	for _, br := range parts {
		if next, prs := target.Branches[br]; prs {
			target = next
		} else {
			// create the branch!
		}
	}
	fmt.Println("target 1:", target)
	return target, nil
}

var pageSize = 100

// func GetDir(path string, pages int) (*viewNode, error) {
func GetDir(path string, pages int) (*models.Node, error) {
	data.mu.RLock()
	request := data.request
	data.mu.RUnlock()
	// parts := strings.Split(path, "/")
	branch, err := getBranch(path, request.Path)
	if err != nil {
		return nil, err
	}

	data.mu.RLock()
	defer data.mu.RUnlock()

	re := parseDirNode(branch.dirNode)
	re.Content = make([]*models.Node, 0, pageSize*pages)
	for _, n := range branch.Dirs {
		re.Content = append(re.Content, parseDirNode(n))
	}
	for _, n := range branch.Files {
		re.Content = append(re.Content, parseFileNode(n))
	}

	// return branch, nil
	return re, nil
}

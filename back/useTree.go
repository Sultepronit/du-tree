package main

import (
	"sort"
)

func getBranchContent(branch *Branch) []*FlatBranch {
	children := []*FlatBranch{} // create it with the length maybe?
	for cn, child := range branch.Content {
		// fmt.Println(child.Name)
		hasCont := false
		if len(child.Content) > 0 {
			hasCont = true
		}
		children = append(children, &FlatBranch{
			Name:       cn,
			Size:       child.Size,
			HasContent: hasCont,
		})
	}

	sort.Slice(children, func(i, j int) bool {
		return children[i].Size > children[j].Size
	})

	return children
}

func getCachedBranch(branches []string) []*FlatBranch {
	// tree := Node{}
	// err := readParseJson("res0.json", &tree)
	// if err != nil {
	// 	panic(err)
	// }
	// prinAsJson(tree)
	// target := &tree
	target := tree
	for _, br := range branches {
		target = target.Content[br]
	}
	re := getBranchContent(target)
	// prinAsJson(re)
	return re
}

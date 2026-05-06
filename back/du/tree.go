package du

import (
	"du-tree/models"
	"log"
	"strings"
	"sync"
)

type treeStr struct {
	mu   sync.RWMutex
	root *rawNode
}

var tree2 = treeStr{}
var sizeBranches map[string]bool

func resetTree() {
	sizeBranches = make(map[string]bool)
	tree2 = treeStr{
		root: &rawNode{
			Temp:    true,
			Content: make(map[string]*rawNode)},
	}
}

func (t *treeStr) fill(path []string, size int64) {
	pathPart := ""
	fullPath := strings.Join(path, "/") + "/"
	// log.Println(path, size, fullPath)

	t.mu.Lock()
	defer t.mu.Unlock()

	// time.Sleep(time.Second)
	// time.Sleep(time.Millisecond * 200)

	if len(path) == 1 && path[0] == "" {
		t.root.Size = size
		t.root.Temp = false
	} else {
		node := t.root
		for _, stage := range path {
			pathPart += stage + "/"
			// log.Println(pathPart)
			if !sizeBranches[fullPath] {
				node.Size += size
				sizeBranches[pathPart] = true
			}

			// node.Size += size
			if val, prs := node.Content[stage]; prs {
				node = val
			} else {
				if node.Content == nil {
					node.Content = make(map[string]*rawNode)
				}

				new := &rawNode{Temp: true}
				node.Content[stage] = new
				node = new
			}
		}
		if node.Size != 0 {
			log.Println(node.Size)
		}
		node.Size = size
		node.Temp = false
		// tempPrinAsJson(sizeBranches)
		delete(sizeBranches, pathPart)
	}

	// tempPrinAsJson(parseNode(t.root, "root"))
}

func (t *treeStr) getDir(path string) models.Node {
	parts := strings.Split(path, "/")

	t.mu.RLock()
	defer t.mu.RUnlock()

	target := t.root
	// log.Println(target)
	for _, br := range parts {
		if br == "" {
			continue
		}
		target = target.Content[br]
	}

	return parseNode(target, parts[len(parts)-1])
}

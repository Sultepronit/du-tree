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

var tree2 = &treeStr{}

func resetTree() {
	tree2 = &treeStr{
		root: &rawNode{Content: make(map[string]*rawNode)},
	}
}

func (t *treeStr) fill(path []string, size int64) {
	log.Println(path, size)

	t.mu.Lock()
	defer t.mu.Unlock()

	if len(path) == 1 && path[0] == "" {
		t.root.Size = size
		t.root.Temp = false
	} else {
		node := t.root
		for _, stage := range path {
			node.Size += size
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
		node.Size = size
		node.Temp = false
	}

	tempPrinAsJson(parseNode(t.root, "root"))
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

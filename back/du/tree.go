package du

import (
	"du-tree/models"
	"strings"
	"sync"
)

type rawNode struct {
	Size int64 `json:"size"`
	Temp bool  `json:"temp,omitempty"`
	// Locked  bool                `json:"locked,omitempty"`
	Locked  int                 `json:"locked,omitempty"`
	Content map[string]*rawNode `json:"content,omitempty"`
}

func (n *rawNode) getSize() int64 {
	if n.Size > 0 || !n.Temp {
		return n.Size
	}

	for _, c := range n.Content {
		n.Size += c.getSize()
	}
	return n.Size
}

type treeStr struct {
	mu   sync.RWMutex
	root *rawNode
}

var tree2 treeStr

func ResetTree() {
	tree2 = treeStr{
		root: &rawNode{
			Temp:    true,
			Content: make(map[string]*rawNode)},
	}
}

// size = -1 - locked
func (t *treeStr) fill(path []string, size int64) {

	t.mu.Lock()
	defer t.mu.Unlock()

	if len(path) == 1 && path[0] == "" {
		t.root.Size = size
		t.root.Temp = false
	} else {
		node := t.root
		for _, stage := range path {
			// if node.Temp && size >= 0 {
			// 	node.Size = 0
			// }
			if size == -1 {
				// node.Locked = 1
				node.Locked++
			} else if node.Temp {
				node.Size = 0
			}

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
		if size == -1 {
			// node.Locked = true
			// node.Locked = 2
			node.Locked = -1
		} else {
			node.Size = size
			node.Temp = false
		}
	}
}

func (t *treeStr) getDir(path string) *models.Node {
	parts := strings.Split(path, "/")
	// log.Println(path)

	t.mu.RLock()
	defer t.mu.RUnlock()

	target := t.root
	// log.Println(target)
	if target == nil {
		return nil
	}
	for _, br := range parts {
		if br == "" {
			continue
		}
		if next, prs := target.Content[br]; prs {
			target = next
		} else {
			return nil
		}
	}

	re := parseNode(target, parts[len(parts)-1])
	// fmt.Println(re)

	return &re
}

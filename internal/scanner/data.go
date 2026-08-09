package scanner

import (
	"context"
	"du-tree/internal/models"
	"sync"
)

type dirNode struct {
	Parent    *dirNode   `json:"-"`
	Name      string     `json:"name"`
	Size      int64      `json:"size"`
	Locked    int        `json:"locked,omitempty"` // -1 means locked itself >=1 means locked children count
	Dirs      []*dirNode `json:"content,omitempty"`
	Temp      int8       `json:"temp,omitempty"`
	IsRemoved bool       `json:"isRemoved,omitempty"`
}

func (n *dirNode) GetName() string { return n.Name }
func (n *dirNode) GetSize() int64  { return n.Size }

type fileNode struct {
	Name       string `json:"name"`
	Size       int64  `json:"size"`
	Type       string `json:"type"`
	ModTime    int64  `json:"modTime"`
	LinkPath   string `json:"linkPath,omitempty"`
	Nlink      uint64 `json:"nlink,omitempty"`
	IsHardlink bool   `json:"isHardlink,omitempty"`
}

func (n *fileNode) GetName() string { return n.Name }
func (n *fileNode) GetSize() int64  { return n.Size }

type viewNode struct {
	*dirNode
	Files    []*fileNode          `json:"files,omitempty"`
	Branches map[string]*viewNode `json:"branches,omitempty"`
}

type scanData struct {
	viewMu   sync.RWMutex
	request  models.Request
	viewTree *viewNode

	scanMu   sync.RWMutex
	cancel   context.CancelFunc
	scanTree *dirNode

	// inodes  map[uint64]bool
	// inodes   map[uint64][]string
	// inodes   map[uint64]string
	indesMu   sync.RWMutex
	devInodes map[uint64]map[uint64]string
}

var data scanData

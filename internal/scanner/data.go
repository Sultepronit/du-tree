package scanner

import (
	"context"
	"du-tree/internal/models"
	"sync"
)

type sizeAttr struct {
	size int64
	dev  uint64
	ino  uint64
	path string
}

type dirNode struct {
	Parent    *dirNode   `json:"-"`
	Name      string     `json:"name"`
	Size      int64      `json:"size"`
	ScanTime  int64      `json:"scanTime"`
	Locked    int        `json:"locked,omitempty"` // -1 means locked itself >=1 means locked children count
	Dirs      []*dirNode `json:"content,omitempty"`
	Temp      int8       `json:"temp,omitempty"`
	IsRemoved bool       `json:"isRemoved,omitempty"`
}

// func (n *dirNode) GetName() string { return n.Name }
// func (n *dirNode) GetSize() int64  { return n.Size }

type fileNode struct {
	Name       string `json:"name"`
	Size       int64  `json:"size"`
	Type       string `json:"type"`
	ModTime    int64  `json:"modTime"`
	ScanTime   int64  `json:"scanTime"`
	LinkPath   string `json:"linkPath,omitempty"`
	Nlink      uint64 `json:"nlink,omitempty"`
	IsHardlink bool   `json:"isHardlink,omitempty"`
}

func (n *fileNode) GetName() string { return n.Name }
func (n *fileNode) GetSize() int64  { return n.Size }

type viewDir struct {
	*dirNode
	ModTime int64 `json:"modTime"`
}

type viewNode struct {
	*dirNode
	ViewDirs []viewDir
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

	inodesMu  sync.RWMutex
	devInodes map[uint64]map[uint64]string
}

var data scanData

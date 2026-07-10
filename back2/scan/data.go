package scan

import (
	"context"
	"du-tree/models"
	"sync"
)

type dirNode struct {
	Parent *dirNode   `json:"-"`
	Name   string     `json:"name"`
	Size   int64      `json:"size"`
	Locked int        `json:"locked,omitempty"`
	Dirs   []*dirNode `json:"content,omitempty"`
	Temp   int8       `json:"temp,omitempty"`
}

type fileNode struct {
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	Type     string `json:"type"`
	LinkPath string `json:"linkPath,omitempty"`
	Nlink    uint64 `json:"nlink,omitempty"`
}

type viewNode struct {
	*dirNode
	Files    []*fileNode          `json:"files,omitempty"`
	Branches map[string]*viewNode `json:"branches,omitempty"`
}

type scanData struct {
	mu       sync.RWMutex
	cancel   context.CancelFunc
	request  models.Request
	inodes   map[uint64]bool
	scanTree *dirNode
	viewTree *viewNode
}

var data scanData

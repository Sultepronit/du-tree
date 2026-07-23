package models

type PathDetail struct {
	Name     string `json:"name"`
	Link     string `json:"link,omitempty"`
	IsLocked bool   `json:"isLocked,omitempty"`
}

type Path struct {
	Current string       `json:"current"`
	Next    []PathDetail `json:"next"`
}

type ReqOptions struct {
	BlockSize bool `json:"blockSize,omitempty"`
}

type Request struct {
	Path  string `json:"path"`
	Pages int    `json:"pages"`
	// Options  []string `json:"options"`
	Options ReqOptions `json:"options"`
}

type SortNode interface {
	GetName() string
	GetSize() int64
}

type Node struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Size         int64   `json:"size"`
	Locked       int     `json:"locked,omitempty"`
	LinkPath     string  `json:"linkPath,omitempty"`
	Nlink        uint64  `json:"nlink,omitempty"`
	Content      []*Node `json:"content,omitempty"`
	ContentCount int     `json:"contentCount,omitempty"`
	SizeIsTemp   bool    `json:"sizeIsTemp,omitempty"`
	Temp         int8    `json:"temp,omitempty"`
	IsNeglected  bool    `json:"isNeglected,omitempty"`
}

func (n *Node) GetName() string { return n.Name }
func (n *Node) GetSize() int64  { return n.Size }

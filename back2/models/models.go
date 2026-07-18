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

type Request struct {
	Path    string   `json:"path"`
	Pages   int      `json:"pages"`
	Command []string `json:"command"`
	Options []string `json:"options"`
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
	IsHardLink   bool    `json:"isHardLink,omitempty"`
}

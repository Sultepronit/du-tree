package models

type Node struct {
	Name       string  `json:"name"`
	Type       string  `json:"type"`
	Size       int64   `json:"size"`
	SizeIsTemp bool    `json:"sizeIsTemp,omitempty"`
	Content    []*Node `json:"content,omitempty"`
}

type Request struct {
	Path string `json:"path"`
}

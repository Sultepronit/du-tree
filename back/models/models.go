package models

type Path struct {
	Current string   `json:"current"`
	Next    []string `json:"next"`
	Msg     string   `json:"msg"`
}

type Request struct {
	Path   string   `json:"path"`
	InitDu bool     `json:"initDu"`
	Comm   []string `json:"command"`
}

type Node struct {
	Name       string `json:"name"`
	Type       string `json:"type"`
	Size       int64  `json:"size"`
	SizeIsTemp bool   `json:"sizeIsTemp,omitempty"`
	// Locked     bool    `json:"locked,omitempty"`
	Locked  int     `json:"locked,omitempty"`
	Content []*Node `json:"content,omitempty"`
}

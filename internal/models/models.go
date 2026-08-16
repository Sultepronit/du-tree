package models

type SystemContext struct {
	IsRoot bool   `json:"isRoot"`
	User   string `json:"user,omitempty"`
	Host   string `json:"host,omitempty"`
}

type PathSugg struct {
	Name     string `json:"name"`
	Link     string `json:"link,omitempty"`
	IsLocked bool   `json:"isLocked,omitempty"`
	IsEmpty  bool   `json:"isEmpty,omitempty"`
}

type Path struct {
	InputPath   string     `json:"inputPath"`
	WorkingPath string     `json:"workingPath,omitempty"`
	Replacement []string   `json:"replacement,omitempty"`
	NextDirs    []PathSugg `json:"nextDirs,omitempty"`
	IsLocked    bool       `json:"isLocked,omitempty"`
}

type ReqOptions struct {
	BlockSize     bool     `json:"blockSize,omitempty"`
	ExcludeHidden bool     `json:"excludeHidden,omitempty"`
	OneFS         bool     `json:"oneFS,omitempty"`
	ExPatt        []string `json:"exPatt,omitempty"`
}

type ReqFilters struct {
	HideHidden bool `json:"hideHidden"`
	MoreThan   struct {
		Value float64 `json:"value"`
		Unit  string  `json:"unit"`
	} `json:"moreThan"`
}

type Request struct {
	Path    string     `json:"path,omitempty"`
	Pages   int        `json:"pages,omitempty"`
	Options ReqOptions `json:"options"`
	Filters ReqFilters `json:"filters"`
}

type UpdateReq struct {
	Filters ReqFilters `json:"filters"`
	List    []struct {
		Path  string `json:"path,omitempty"`
		Pages int    `json:"pages,omitempty"`
	} `json:"list"`
}

type SortNode interface {
	GetName() string
	GetSize() int64
}

type Node struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Size         int64   `json:"size"`
	ModTime      int64   `json:"modTime"`
	ScanTime     int64   `json:"scanTime"`
	Locked       int     `json:"locked,omitempty"`
	LinkPath     string  `json:"linkPath,omitempty"`
	Nlink        uint64  `json:"nlink,omitempty"`
	Content      []*Node `json:"content,omitempty"`
	ContentCount int     `json:"contentCount,omitempty"`
	// SizeIsTemp   bool    `json:"sizeIsTemp,omitempty"`
	Temp        int8 `json:"temp,omitempty"`
	IsNeglected bool `json:"isNeglected,omitempty"`
}

type Branch struct {
	Name         string  `json:"name"`
	Size         int64   `json:"size"`
	Locked       int     `json:"locked,omitempty"`
	ContentCount int     `json:"contentCount,omitempty"`
	Temp         int8    `json:"temp,omitempty"`
	IsFiltered   bool    `json:"isFiltered,omitempty"`
	Content      []*Node `json:"content,omitempty"`
	HiddenItems  int     `json:"hiddenItems,omitempty"`
	HiddenSize   int64   `json:"hiddenSize,omitempty"`
}

func (n *Node) GetName() string { return n.Name }
func (n *Node) GetSize() int64  { return n.Size }

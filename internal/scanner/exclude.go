package scanner

import (
	"du-tree/internal/models"
	"path/filepath"
	"strings"
)

func exculde(options models.ReqOptions, fullPath string, name string) bool {
	if options.ExcludeHidden && strings.HasPrefix(name, ".") {
		return true
	}

	if len(options.ExPatt) == 0 {
		return false
	}

	for _, p := range options.ExPatt {
		if matched, _ := filepath.Match(p, name); matched {
			return true
		}

		if matched, _ := filepath.Match(p, fullPath); matched {
			return true
		}
	}

	return false
}

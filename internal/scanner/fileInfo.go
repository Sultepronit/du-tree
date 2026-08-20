package scanner

import (
	"io/fs"
	"os"
	"syscall"
)

func getFileInfo(entry os.DirEntry) (fs.FileInfo, *syscall.Stat_t, error) {
	info, err := entry.Info()
	if err != nil {
		// not exists, no permission etc
		return nil, nil, err
	}

	if stat, ok := info.Sys().(*syscall.Stat_t); ok {
		return info, stat, nil
	}

	return info, nil, nil
}

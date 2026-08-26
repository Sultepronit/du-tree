package scanner

import (
	"du-tree/internal/explorer"
	"du-tree/internal/helpers"
	"du-tree/internal/models"
	"errors"
	"log"
	"os"
	"path/filepath"
	"syscall"
	"time"
)

// func getDirCont(path string, options models.ReqOptions) ([]*fileNode, error) {
func getDirCont(path string, options models.ReqOptions) (files []*fileNode, dirs map[string]int64, err error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		// return nil, err
		return
	}

	oversized := make([]*fileNode, 0, len(entries))
	dirs = make(map[string]int64, len(entries))
	t := time.Now().UnixMilli()

	for _, e := range entries {
		fullPath := filepath.Join(path, e.Name())

		if exc := exculde(options, fullPath, e.Name()); exc {
			continue
		}

		info, stat, err := getFileInfo(e)
		if err != nil {
			var errno syscall.Errno
			if errors.As(err, &errno) {
				switch errno {
				case syscall.EIO:
					log.Println("I/O Error:", err)
					node := &fileNode{
						Name:     e.Name(),
						ModTime:  0,
						ScanTime: t,
						Type:     "ioe-",
					}
					if e.IsDir() {
						node.Type = "ioed"
					}
					oversized = append(oversized, node)
				default:
					log.Println("dirCont/getFileInfo:", err)
				}
			}
			// return nil, nil, err
			continue
		}

		if options.OneFS && stat != nil && stat.Dev != rootDev {
			// fmt.Println("dev:", stat.Dev)
			continue
		}

		if e.IsDir() {
			dirs[e.Name()] = info.ModTime().UnixMilli()
			continue
		}

		node := &fileNode{
			Name:     e.Name(),
			ModTime:  info.ModTime().UnixMilli(),
			ScanTime: t,
			Type:     e.Type().String()[0:1],
		}
		oversized = append(oversized, node)

		if node.Type == "L" {
			typ, realPath := explorer.GetLinkInfo(path, node.Name)
			node.Type += typ
			node.LinkPath = realPath
		}

		// fmt.Println(stat.Nlink, stat.Ino)
		if stat.Nlink > 1 {
			data.inodesMu.RLock()
			node.Nlink = stat.Nlink
			// if data.devInodes[stat.Dev][stat.Ino] != filepath.Join(path, node.Name) {
			if data.devInodes[stat.Dev][stat.Ino] != fullPath {
				node.IsHardlink = true
			}
			data.inodesMu.RUnlock()
		}

		// if blockSizeReq {
		if options.BlockSize {
			node.Size = stat.Blocks * 512
		} else {
			node.Size = info.Size()
		}
	}

	files = make([]*fileNode, len(oversized))
	copy(files, oversized)

	helpers.SortBySizeThenName(files)
	// helpers.TempPrinAsJson(re)

	return
}

package scanner

import (
	"du-tree/internal/explorer"
	"du-tree/internal/helpers"
	"du-tree/internal/models"
	"fmt"
	"os"
	"path/filepath"
	"strings"
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
		// if e.IsDir() {
		// 	continue
		// }

		if options.ExcludeHidden && strings.HasPrefix(e.Name(), ".") {
			continue
		}

		// info, err := e.Info()
		// if err != nil {
		// 	return nil, err
		// }

		// stat, ok := info.Sys().(*syscall.Stat_t)
		// if !ok {
		// 	return nil, errors.New("no file info")
		// }
		info, stat, err := getFileInfo(e)
		if err != nil {
			return nil, nil, err
		}

		if options.OneFS && stat != nil && stat.Dev != rootDev {
			fmt.Println("dev:", stat.Dev)
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
			if data.devInodes[stat.Dev][stat.Ino] != filepath.Join(path, node.Name) {
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

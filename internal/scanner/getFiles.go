package scanner

import (
	"du-tree/internal/explorer"
	"du-tree/internal/helpers"
	"du-tree/internal/models"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

func getFiles(path string, options models.ReqOptions) ([]*fileNode, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	oversized := make([]*fileNode, 0, len(entries))

	for _, e := range entries {
		if e.IsDir() {
			continue
		}

		if options.ExcludeHidden && strings.HasPrefix(e.Name(), ".") {
			continue
		}

		info, err := e.Info()
		if err != nil {
			return nil, err
		}

		stat, ok := info.Sys().(*syscall.Stat_t)
		if !ok {
			return nil, errors.New("no file info")
		}

		if options.OneFS && stat != nil && stat.Dev != rootDev {
			fmt.Println("dev:", stat.Dev)
			continue
		}

		node := &fileNode{
			Name: e.Name(),
			Type: e.Type().String()[0:1],
		}
		oversized = append(oversized, node)

		if node.Type == "L" {
			typ, realPath := explorer.GetLinkInfo(path, node.Name)
			node.Type += typ
			node.LinkPath = realPath
		}

		// fmt.Println(stat.Nlink, stat.Ino)
		if stat.Nlink > 1 {
			data.indesMu.RLock()
			node.Nlink = stat.Nlink
			// if (data.inodes[stat.Ino][0] != filepath.Join(path, node.Name)) {
			// if data.inodes[stat.Ino] != filepath.Join(path, node.Name) {
			if data.devInodes[stat.Dev][stat.Ino] != filepath.Join(path, node.Name) {
				// if data.inodes[stat.Ino] {
				node.IsHardlink = true
			}
			data.indesMu.RUnlock()
		}

		// if blockSizeReq {
		if options.BlockSize {
			node.Size = stat.Blocks * 512
		} else {
			node.Size = info.Size()
		}
	}

	re := make([]*fileNode, len(oversized))
	copy(re, oversized)
	helpers.SortBySizeThenName(re)
	// helpers.TempPrinAsJson(re)

	return re, nil
}

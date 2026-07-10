package scan

import (
	"du-tree/explorer"
	"errors"
	"os"
	"syscall"
)

func getFiles(path string, blockSizeReq bool) ([]*fileNode, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	inflated := make([]*fileNode, 0, len(entries))

	for _, e := range entries {
		if e.IsDir() {
			continue
		}

		node := &fileNode{
			Name: e.Name(),
			Type: e.Type().String()[0:1],
		}
		inflated = append(inflated, node)

		if node.Type == "L" {
			typ, realPath := explorer.GetRealEntity(path, node.Name)
			node.Type += typ
			node.LinkPath = realPath
		}
		info, err := e.Info()
		if err != nil {
			return nil, err
		}

		stat, ok := info.Sys().(*syscall.Stat_t)
		if !ok {
			return nil, errors.New("no file info")
		}
		// fmt.Println(stat.Nlink, stat.Ino)
		if stat.Nlink > 1 {
			node.Nlink = stat.Nlink
		}

		if blockSizeReq {
			node.Size = stat.Blocks * 512
		} else {
			node.Size = info.Size()
		}
	}

	re := make([]*fileNode, len(inflated))
	copy(re, inflated)

	return re, nil
}

package explorer

import (
	"du-tree/models"
	"errors"
	"os"
	"syscall"
)

func ReadDir(path string, blockSizeReq bool) ([]*models.Node, error) {
	re := make([]*models.Node, 0, 10)
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	for _, e := range entries {
		var node models.Node
		re = append(re, &node)
		node.Name = e.Name()
		node.Type = e.Type().String()[0:1]
		if node.Type == "d" {
			node.SizeIsTemp = true
			continue
		} else if node.Type == "L" {
			typ, realPath := GetLinkInfo(path, node.Name)
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

	return re, nil
}

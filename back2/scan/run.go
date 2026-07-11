package scan

import (
	"context"
	"du-tree/models"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"syscall"
)

func getRootBlockSize(target string) (int64, error) {
	info, err := os.Lstat(target)
	if err != nil {
		return 0, err
	}
	if sysStat, ok := info.Sys().(*syscall.Stat_t); ok {
		return sysStat.Blocks * 512, nil
	}

	return 0, errors.New("no file info")
}

// func calcSize(ctx context.Context, path string, node *models.Node, entry os.DirEntry) error {
func calcSize(entry os.DirEntry) (int64, error) {
	info, err := entry.Info()
	if err != nil {
		return 0, err
	}

	sysStat, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return 0, nil
	}

	var size int64
	if true {
		size = sysStat.Blocks * 512
	} else if !entry.IsDir() {
		size = info.Size()
	}

	if sysStat.Nlink > 1 {
		if data.inodes[sysStat.Ino] {
			size = 0
		}
		data.inodes[sysStat.Ino] = true
	}

	return size, nil
}

// func scanDir(ctx context.Context, path string, node *models.Node) error {
func scanDir(ctx context.Context, path string, node *dirNode) error {
	fmt.Println("scan:", path)
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}
	// fmt.Println(ctx)

	entries, err := os.ReadDir(path)
	if err != nil {
		return err
	}

	data.mu.Lock()

	dirs := make([]*dirNode, 0, len(entries))

	for _, entry := range entries {
		size, err := calcSize(entry)
		if err != nil {
			fmt.Println(err)
		}

		for n := node; n != nil; n = n.Parent {
			n.Size += size
		}

		if entry.IsDir() {
			dirs = append(dirs, &dirNode{
				Parent: node,
				Name:   entry.Name(),
				Size:   size,
				Temp:   2,
			})
		}
	}

	node.Dirs = make([]*dirNode, len(dirs))
	copy(node.Dirs, dirs)

	node.Temp = 1

	data.mu.Unlock()
	for _, child := range node.Dirs {
		fullPath := filepath.Join(path, child.Name)
		err := scanDir(ctx, fullPath, child)
		if err != nil {
			return err
		}
	}
	node.Temp = 0
	// helpers.TempPrinAsJson(data.result)
	return nil
}

func Init(req models.Request) {
	data.mu.Lock()

	if data.cancel != nil {
		log.Println("Previous scan is still running!")
	}

	ctx, cancel := context.WithCancel(context.Background())
	data.cancel = cancel

	data.request = req

	data.inodes = make(map[uint64]bool)
	// data.scanTree = &models.Node{
	// 	Content: make([]*models.Node, 0, 10),
	// }
	data.scanTree = &dirNode{
		Temp: 2,
		// Content: make([]*dirNode, 0, 10),
	}
	// data.viewTree = &viewNode{
	// 	dirNode:  data.scanTree,
	// 	Branches: make(map[string]*viewNode),
	// }
	data.viewTree = nil

	rootSize, err := getRootBlockSize(data.request.Path)
	if err != nil {
		fmt.Println(err)
		return
	}
	data.scanTree.Size = rootSize
	data.mu.Unlock()

	// go scanDir(ctx, data.request.Path, data.result)
	err = scanDir(ctx, data.request.Path, data.scanTree)
	fmt.Println(err)

	fmt.Println("ended!!!")
	// helpers.TempPrinAsJson(data.scanTree)
}

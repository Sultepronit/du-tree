package scan

import (
	"context"
	"du-tree/helpers"
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

func handleEntry(ctx context.Context, path string, node *models.Node, entry os.DirEntry) error {
	info, err := entry.Info()
	if err != nil {
		return err
	}

	sysStat, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return nil
	}

	var size int64
	if true {
		size = sysStat.Blocks * 512
	} else if !entry.IsDir() {
		size = info.Size()
	}

	data.mu.Lock()
	if sysStat.Nlink > 1 {
		if data.inodes[sysStat.Ino] {
			// data.mu.Unlock()
			// continue
			size = 0
		}
		data.inodes[sysStat.Ino] = true
	}

	// node.Size += size
	// fmt.Println("file:", entry.Name())
	// fmt.Println("dir:", node.Name, node.Size)
	for n := node; n != nil; n = n.Parent {
		n.Size += size
		// fmt.Println("dir:", p.Name, p.Size)
	}

	if entry.IsDir() {
		child := &models.Node{
			Parent:  node,
			Name:    entry.Name(),
			Type:    "d",
			Size:    size,
			Content: make([]*models.Node, 0, 10),
		}
		node.Content = append(node.Content, child)

		data.mu.Unlock()

		fullPath := filepath.Join(path, entry.Name())
		err := scanDir(ctx, fullPath, child)
		if err != nil {
			return err
		}
	} else {
		// child := &models.Node{
		// 	Name: entry.Name(),
		// 	Type: "-",
		// 	Size: size,
		// }
		// node.Content = append(node.Content, child)
		data.mu.Unlock()
	}

	return nil
}

func scanDir(ctx context.Context, path string, node *models.Node) error {
	fmt.Println("scan:", path)
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}
	// fmt.Println(ctx)

	entries, err := os.ReadDir(path)
	if err != nil {
		return err // Пропускаємо папки без доступу (у вас для цього червоні замки!)
	}

	node.SizeIsTemp = true
	for _, entry := range entries {
		err := handleEntry(ctx, path, node, entry)
		if err != nil {
			fmt.Println(err)
		}
	}
	node.SizeIsTemp = false

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
	data.result = &models.Node{
		// SizeIsTemp: true,
		Content: make([]*models.Node, 0, 10),
	}

	rootSize, err := getRootBlockSize(data.request.Path)
	if err != nil {
		fmt.Println(err)
		return
	}
	data.result.Size = rootSize
	data.mu.Unlock()

	// go scanDir(ctx, data.request.Path, data.result)
	err = scanDir(ctx, data.request.Path, data.result)
	fmt.Println(err)

	fmt.Println("ended!!!")
	helpers.TempPrinAsJson(data.result)
}

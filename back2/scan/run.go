package scan

import (
	"context"
	"du-tree/explorer"
	"du-tree/models"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"syscall"
	"time"
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

func scanDir(ctx context.Context, path string, node *dirNode) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	// to check if the dir is locked, without looking at node.Locked
	if !explorer.IsAccessible(path, "") {
		return nil
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		// fmt.Println("errr reading", err)
		if os.IsPermission(err) {
			data.mu.Lock()
			node.Locked = -1
			node.Temp = 0

			for p := node.Parent; p != nil; p = p.Parent {
				p.Locked++
			}
			data.mu.Unlock()
			return nil
		}

		return err
	}

	data.mu.Lock()

	dirs := make([]*dirNode, 0, len(entries))

	for _, entry := range entries {
		time.Sleep(time.Millisecond * 50)
		size, err := calcSize(entry)
		if err != nil {
			fmt.Println(err)
		}

		for n := node; n != nil; n = n.Parent {
			n.Size += size
		}

		if entry.IsDir() {
			child := dirNode{
				Parent: node,
				Name:   entry.Name(),
				Size:   size,
				Temp:   2,
			}

			locked := !explorer.IsAccessible(path, entry.Name())
			if locked {
				child.Locked = -1
				child.Temp = 0

				for p := node; p != nil; p = p.Parent {
					p.Locked++
				}
			}
			dirs = append(dirs, &child)
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
	data.scanTree = &dirNode{Temp: 2}
	data.viewTree = &viewNode{dirNode: data.scanTree}
	// data.viewTree = nil

	rootSize, err := getRootBlockSize(data.request.Path)
	if err != nil {
		fmt.Println(err)
		return
	}
	data.scanTree.Size = rootSize
	data.mu.Unlock()

	// err = scanDir(ctx, data.request.Path, data.scanTree)
	// fmt.Println(err)
	go func() {
		err = scanDir(ctx, data.request.Path, data.scanTree)
		fmt.Println(err)

		data.mu.Lock()
		data.cancel = nil
		data.mu.Unlock()
		fmt.Println("ended!")
	}()

	// helpers.TempPrinAsJson(data.scanTree)
}

func Stop() {
	data.mu.Lock()
	defer data.mu.Unlock()

	if data.cancel != nil {
		log.Println("Stopping scan...")
		data.cancel()
		data.cancel = nil
	} else {
		log.Println("No scan is currently running.")
	}
}

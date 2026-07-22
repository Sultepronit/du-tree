package scan

import (
	"context"
	"du-tree/internal/explorer"
	"du-tree/internal/models"
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

func calcSize(entry os.DirEntry, reqBlockSize bool, path string) (int64, error) {
	info, err := entry.Info()
	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil
		}
		return 0, err
	}

	sysStat, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return 0, nil
	}

	var size int64
	if reqBlockSize {
		size = sysStat.Blocks * 512
	} else if !entry.IsDir() {
		size = info.Size()
	}

	if sysStat.Nlink > 1 && !entry.IsDir() {
		fullPath := filepath.Join(path, entry.Name())
		// if data.inodes[sysStat.Ino] {
		if data.inodes[sysStat.Ino] != "" {
			// data.inodes[sysStat.Ino] = append(data.inodes[sysStat.Ino], fullPath)
			size = 0
			// size *= -1
		} else {
			// data.inodes[sysStat.Ino] = []string{fullPath}
			// data.inodes[sysStat.Ino] = true
			data.inodes[sysStat.Ino] = fullPath
		}

		// fmt.Println(sysStat.Nlink, sysStat.Ino)
		// helpers.TempPrinAsJson(data.inodes[sysStat.Ino])
	}

	return size, nil
}

func scanDir(ctx context.Context, path string, node *dirNode, reqBlockSize bool) error {
	// fmt.Println("scanning:", path)
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
		// time.Sleep(time.Millisecond * 10)
		size, err := calcSize(entry, reqBlockSize, path)
		if err != nil {
			fmt.Println("run/calcSize:", err)
		}

		if size > 0 {
			for n := node; n != nil; n = n.Parent {
				n.Size += size
			}
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

	content := make([]*dirNode, len(node.Dirs))
	copy(content, node.Dirs)

	data.mu.Unlock()
	// fmt.Println(node.Dirs)
	// for _, child := range node.Dirs {
	for _, child := range content {
		fullPath := filepath.Join(path, child.Name)
		err := scanDir(ctx, fullPath, child, reqBlockSize)
		if err != nil {
			return err
		}
	}

	data.mu.Lock()
	node.Temp = 0
	data.mu.Unlock()

	// helpers.TempPrinAsJson(data.result)
	return nil
}

func Init(req models.Request) (*models.Node, error) {
	log.Println("Scanning:", req.Path)
	data.mu.Lock()

	if data.cancel != nil {
		log.Println("Previous scan is still running!")
	}

	ctx, cancel := context.WithCancel(context.Background())
	data.cancel = cancel

	data.request = req

	// data.inodes = make(map[uint64][]string)
	// data.inodes = make(map[uint64]bool)
	data.inodes = make(map[uint64]string)
	data.scanTree = &dirNode{Temp: 2}
	data.viewTree = &viewNode{dirNode: data.scanTree}

	if req.Options.BlockSize {
		rootSize, err := getRootBlockSize(data.request.Path)
		if err != nil {
			fmt.Println(err)
			return nil, nil
		}
		data.scanTree.Size = rootSize
	}
	data.mu.Unlock()

	go func() {
		err := scanDir(ctx, data.request.Path, data.scanTree, req.Options.BlockSize)
		if err != nil {
			fmt.Println("run/scanDir:", err)
		}

		data.mu.Lock()
		data.cancel = nil
		log.Println("Total:", data.scanTree.Size)
		data.mu.Unlock()
	}()

	// helpers.TempPrinAsJson(data.scanTree)
	time.Sleep(time.Millisecond * 100)
	return GetDir("", req.Pages)
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

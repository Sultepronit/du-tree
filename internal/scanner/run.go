package scanner

import (
	"context"
	"du-tree/internal/explorer"
	"du-tree/internal/models"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
)

func handleReadDir(path string, node *dirNode) ([]os.DirEntry, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		if os.IsPermission(err) {
			data.mu.Lock()
			node.Locked = -1
			node.Temp = 0

			for p := node.Parent; p != nil; p = p.Parent {
				p.Locked++
			}
			data.mu.Unlock()
			return nil, nil
		} else if os.IsNotExist(err) {
			data.mu.Lock()
			node.IsRemoved = true // TO DO!
			node.Temp = 0
			data.mu.Unlock()
			return nil, nil
		}

		return nil, err
	}

	return entries, nil
}

func getInfo(entry os.DirEntry) (fs.FileInfo, *syscall.Stat_t, error) {
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

func calcSize(entry os.DirEntry, info fs.FileInfo, stat *syscall.Stat_t, reqBlockSize bool, path string) int64 {
	var size int64
	if reqBlockSize {
		size = stat.Blocks * 512
	} else if !entry.IsDir() {
		size = info.Size()
	}

	if stat.Nlink > 1 && !entry.IsDir() {
		if data.devInodes[stat.Dev] == nil {
			data.devInodes[stat.Dev] = make(map[uint64]string)
			data.devInodes[stat.Dev][stat.Ino] = path
		} else if data.devInodes[stat.Dev][stat.Ino] == "" {
			data.devInodes[stat.Dev][stat.Ino] = path
		} else {
			size = 0
		}
	}

	return size
}

func collectDirs(dirs []*dirNode, entry os.DirEntry, parent *dirNode, size int64, fullPath string) []*dirNode {
	if !entry.IsDir() {
		return dirs
	}

	child := dirNode{
		Parent: parent,
		Name:   entry.Name(),
		Size:   size,
		Temp:   2,
	}

	status := explorer.CheckDirStatus(fullPath)
	if status == explorer.NotFound {
		return dirs
	}

	switch status {
	case explorer.Empty:
		child.Temp = 0
	case explorer.Forbidden:
		child.Temp = 0
		child.Locked = -1

		for p := parent; p != nil; p = p.Parent {
			p.Locked++
		}
	}

	return append(dirs, &child)
}

var sem = make(chan struct{}, 4)

// var sem = make(chan struct{}, 2)

// var sem = make(chan struct{}, 8)
// var sem = make(chan struct{}, 1)

func scanDir(ctx context.Context, path string, node *dirNode, options models.ReqOptions) error {
	// fmt.Println("scanning:", path)
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	entries, err := handleReadDir(path, node)
	if err != nil {
		return err
	}
	if entries == nil {
		return nil
	}

	dirs := make([]*dirNode, 0, len(entries))

	data.mu.Lock()

	for _, entry := range entries {
		if options.ExcludeHidden && strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		info, stat, err := getInfo(entry)
		if err != nil {
			if !os.IsNotExist(err) {
				fmt.Println("run/getInfo:", err)
			}

			continue
		}

		if options.OneFS && stat != nil && stat.Dev != rootDev {
			// fmt.Println("dev:", stat.Dev, entry.Name())
			continue
		}

		// time.Sleep(time.Millisecond * 30)

		fullPath := filepath.Join(path, entry.Name())

		size := calcSize(entry, info, stat, options.BlockSize, fullPath)

		dirs = collectDirs(dirs, entry, node, size, fullPath)

		if size > 0 {
			for n := node; n != nil; n = n.Parent {
				n.Size += size
			}
		}
	}

	node.Dirs = make([]*dirNode, len(dirs))
	copy(node.Dirs, dirs)

	node.Temp = 1

	recursive := make([]*dirNode, 0, len(node.Dirs))
	// copy(recursive, node.Dirs)
	for _, d := range node.Dirs {
		if d.Temp > 0 {
			recursive = append(recursive, d)
		}
	}

	data.mu.Unlock()

	var wg sync.WaitGroup

	for _, child := range recursive {
		fullPath := filepath.Join(path, child.Name)
		// err := scanDir(ctx, fullPath, child, options)
		// if err != nil {
		// 	return err
		// }
		select {
		case sem <- struct{}{}:
			wg.Add(1)
			go func() {
				fmt.Print(1)
				defer wg.Done()
				defer func() { <-sem }()
				err := scanDir(ctx, fullPath, child, options)
				if err != nil {
					fmt.Println("run/ScanDir:", err)
				}
			}()
		default:
			fmt.Print(0)
			err := scanDir(ctx, fullPath, child, options)
			if err != nil {
				return err
			}
		}
	}

	wg.Wait()

	data.mu.Lock()
	node.Temp = 0
	data.mu.Unlock()

	// helpers.TempPrinAsJson(data.result)
	// helpers.TempPrinAsJson(data.devInodes)
	return nil
}

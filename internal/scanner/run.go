package scanner

import (
	"context"
	"du-tree/internal/explorer"
	"du-tree/internal/models"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
)

func handleReadDir(path string, node *dirNode) ([]os.DirEntry, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		if os.IsPermission(err) {
			data.scanMu.Lock()
			node.Locked = -1
			node.Temp = 0

			for p := node.Parent; p != nil; p = p.Parent {
				p.Locked++
			}
			data.scanMu.Unlock()
			return nil, nil
		} else if os.IsNotExist(err) {
			data.scanMu.Lock()
			node.IsRemoved = true // TO DO!
			node.Temp = 0
			data.scanMu.Unlock()
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

// func getSizeEtc(entry os.DirEntry, info fs.FileInfo, stat *syscall.Stat_t, reqBlockSize bool, path string) int64 {
func getSizeEtc(entry os.DirEntry, info fs.FileInfo, stat *syscall.Stat_t, reqBlockSize bool, path string) sizeAttr {
	// var size int64
	s := sizeAttr{}
	if reqBlockSize {
		// size = stat.Blocks * 512
		s.size = stat.Blocks * 512
	} else if !entry.IsDir() {
		// size = info.Size()
		s.size = info.Size()
	}

	if stat.Nlink > 1 && !entry.IsDir() {
		// data.inodesMu.Lock()
		// if data.devInodes[stat.Dev] == nil {
		// 	data.devInodes[stat.Dev] = make(map[uint64]string)
		// 	data.devInodes[stat.Dev][stat.Ino] = path
		// } else if data.devInodes[stat.Dev][stat.Ino] == "" {
		// 	data.devInodes[stat.Dev][stat.Ino] = path
		// } else {
		// 	size = 0
		// }
		// data.inodesMu.Unlock()
		s.dev = stat.Dev
		s.ino = stat.Ino
		s.path = path
	}

	// return size
	return s
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

		data.scanMu.Lock()
		for p := parent; p != nil; p = p.Parent {
			p.Locked++
		}
		data.scanMu.Unlock()
	}

	return append(dirs, &child)
}

// var sem = make(chan struct{}, 4)

// var sem = make(chan struct{}, 2)

// var sem = make(chan struct{}, 8)

// var sem = make(chan struct{}, 1)

var sem = make(chan struct{}, runtime.NumCPU()*2)

// var sem = make(chan struct{}, runtime.NumCPU())

func scanDir(ctx context.Context, path string, node *dirNode, options models.ReqOptions) error {
	// fmt.Println("scanning:", path)
	select {
	case <-ctx.Done():
		return ctx.Err()
		// return nil
	default:
	}

	// start := time.Now()
	entries, err := handleReadDir(path, node)
	if err != nil {
		return err
	}
	if entries == nil {
		return nil
	}
	// fmt.Println("read dir:", time.Since(start))

	dirsOversized := make([]*dirNode, 0, len(entries))

	// var dirContSize int64
	sizes := make([]sizeAttr, 0, len(entries))

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

		sizeEtc := getSizeEtc(entry, info, stat, options.BlockSize, fullPath)

		dirsOversized = collectDirs(dirsOversized, entry, node, sizeEtc.size, fullPath)

		// data.scanMu.Lock()
		// if size > 0 {
		// 	for n := node; n != nil; n = n.Parent {
		// 		n.Size += size
		// 	}
		// }
		// data.scanMu.Unlock()

		// dirContSize += size

		sizes = append(sizes, sizeEtc)
	}

	// node.Dirs = make([]*dirNode, len(dirsOversized))
	// copy(node.Dirs, dirsOversized)

	// node.Temp = 1

	dirs := make([]*dirNode, len(dirsOversized))
	copy(dirs, dirsOversized)

	// recursive := make([]*dirNode, 0, len(node.Dirs))
	recursive := make([]*dirNode, 0, len(dirs))
	for _, d := range dirs {
		if d.Temp > 0 {
			recursive = append(recursive, d)
		}
	}

	var dirContSize int64
	locked := false
	for _, s := range sizes {
		if s.ino != 0 {
			if !locked {
				locked = true
				data.inodesMu.Lock()
			}

			if data.devInodes[s.dev] == nil {
				data.devInodes[s.dev] = make(map[uint64]string)
				data.devInodes[s.dev][s.ino] = s.path
			} else if data.devInodes[s.dev][s.ino] == "" {
				data.devInodes[s.dev][s.ino] = s.path
			} else {
				// the inode is counted already
				continue
			}
		}

		dirContSize += s.size
	}

	if locked {
		data.inodesMu.Unlock()
	}

	data.scanMu.Lock()

	if dirContSize > 0 {
		for n := node; n != nil; n = n.Parent {
			n.Size += dirContSize
		}
	}

	node.Dirs = dirs

	node.Temp = 1

	data.scanMu.Unlock()

	// fmt.Println("parse dir:", time.Since(start))

	var wg sync.WaitGroup

	for _, child := range recursive {
		fullPath := filepath.Join(path, child.Name)
		// err := scanDir(ctx, fullPath, child, options)
		// if err != nil {
		// 	return err
		// }
		select {
		case <-ctx.Done():
			// return nil
			return ctx.Err()
		case sem <- struct{}{}:
			wg.Add(1)
			go func() {
				defer wg.Done()
				defer func() { <-sem }()
				err := scanDir(ctx, fullPath, child, options)
				if err != nil {
					fmt.Println("run/ScanDir:", err)
				}
			}()
		default:
			err := scanDir(ctx, fullPath, child, options)
			if err != nil {
				return err
			}
		}
	}

	wg.Wait()

	data.scanMu.Lock()
	node.Temp = 0
	data.scanMu.Unlock()

	// helpers.TempPrinAsJson(data.result)
	// helpers.TempPrinAsJson(data.devInodes)
	return nil
}

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
	"sync/atomic"
	"syscall"
)

// func calcSize0(entry os.DirEntry, reqBlockSize bool, path string) (int64, error) {
// 	info, err := entry.Info()
// 	if err != nil {
// 		if os.IsNotExist(err) {
// 			return 0, nil
// 		}
// 		return 0, err
// 	}

// 	stat, ok := info.Sys().(*syscall.Stat_t)
// 	if !ok {
// 		return 0, nil
// 	}

// 	var size int64
// 	if reqBlockSize {
// 		size = stat.Blocks * 512
// 	} else if !entry.IsDir() {
// 		size = info.Size()
// 	}

// 	if stat.Nlink > 1 && !entry.IsDir() {
// 		fullPath := filepath.Join(path, entry.Name())
// 		// if data.inodes[sysStat.Ino] {
// 		// if data.inodes[sysStat.Ino] != "" {
// 		// if data.devInodes[stat.Dev][stat.Ino] != "" {
// 		// 	// data.inodes[sysStat.Ino] = append(data.inodes[sysStat.Ino], fullPath)
// 		// 	size = 0
// 		// } else {
// 		// 	// data.inodes[sysStat.Ino] = []string{fullPath}
// 		// 	// data.inodes[sysStat.Ino] = true
// 		// 	// data.inodes[stat.Ino] = fullPath
// 		// 	data.devInodes[stat.Dev][stat.Ino] = fullPath
// 		// }
// 		if data.devInodes[stat.Dev] == nil {
// 			data.devInodes[stat.Dev] = make(map[uint64]string)
// 			data.devInodes[stat.Dev][stat.Ino] = fullPath
// 		} else if data.devInodes[stat.Dev][stat.Ino] == "" {
// 			data.devInodes[stat.Dev][stat.Ino] = fullPath
// 		} else {
// 			size = 0
// 		}

// 		// fmt.Println(sysStat.Nlink, sysStat.Ino)
// 		// helpers.TempPrinAsJson(data.inodes[sysStat.Ino])
// 	}

// 	return size, nil
// }

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

func calcSize2(entry os.DirEntry, info fs.FileInfo, stat *syscall.Stat_t, reqBlockSize bool, fullPath string) int64 {
	var size int64
	if reqBlockSize {
		size = stat.Blocks * 512
	} else if !entry.IsDir() {
		size = info.Size()
	}

	if stat.Nlink > 1 && !entry.IsDir() {
		if data.devInodes[stat.Dev] == nil {
			data.devInodes[stat.Dev] = make(map[uint64]string)
			data.devInodes[stat.Dev][stat.Ino] = fullPath
		} else if data.devInodes[stat.Dev][stat.Ino] == "" {
			data.devInodes[stat.Dev][stat.Ino] = fullPath
		} else {
			size = 0
		}
	}

	return size
}

func releaseParent(activeSiblings *atomic.Int64, node *dirNode) {
	remaining := activeSiblings.Add(-1)
	// fmt.Println("rem:", remaining)
	if remaining == 0 {
		data.mu.Lock()

		if node.Parent != nil {
			// fmt.Println(node.Parent.Name, node.Name)
			node.Parent.Temp = 0
		} else {
			// fmt.Println("orphan*", node.Name)
		}
		data.mu.Unlock()
	}
}

// func scanDir(ctx context.Context, path string, node *dirNode, reqBlockSize bool) error {
// func scanDir(ctx context.Context, path string, node *dirNode, options models.ReqOptions, wg *sync.WaitGroup) error {
func scanDir(ctx context.Context, path string, node *dirNode, options models.ReqOptions, activeSiblings *atomic.Int64) error {
	// defer wg.Done()
	defer releaseParent(activeSiblings, node)
	// fmt.Println("scanning:", path)
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

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
			return nil
		} else if os.IsNotExist(err) {
			data.mu.Lock()
			node.IsRemoved = true // TO DO!
			node.Temp = 0
			data.mu.Unlock()
			return nil
		}

		return err
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

		// if options.OneFS && stat != nil && entry.IsDir() && stat.Dev != rootDev {
		if options.OneFS && stat != nil && stat.Dev != rootDev {
			// fmt.Println("dev:", stat.Dev, entry.Name())
			continue
		}

		// time.Sleep(time.Millisecond * 30)

		fullPath := filepath.Join(path, entry.Name())

		size := calcSize2(entry, info, stat, options.BlockSize, fullPath)

		// size, err := calcSize(entry, reqBlockSize, path)
		// size, err := calcSize(entry, options.BlockSize, path)
		// if err != nil {
		// 	fmt.Println("run/calcSize:", err)
		// }

		if entry.IsDir() {
			child := dirNode{
				Parent: node,
				Name:   entry.Name(),
				Size:   size,
				Temp:   2,
			}

			// locked := !explorer.IsAccessible(path, entry.Name())
			// if locked {
			// 	child.Locked = -1
			// 	child.Temp = 0

			// 	for p := node; p != nil; p = p.Parent {
			// 		p.Locked++
			// 	}
			// }
			// dirs = append(dirs, &child)
			// status := explorer.CheckDirStatus(filepath.Join(path, entry.Name()))
			status := explorer.CheckDirStatus(fullPath)
			if status == explorer.NotFound {
				continue
			}

			switch status {
			case explorer.Empty:
				child.Temp = 0
			case explorer.Forbidden:
				child.Temp = 0
				child.Locked = -1

				for p := node; p != nil; p = p.Parent {
					p.Locked++
				}
			}

			dirs = append(dirs, &child)
		}

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

	// cwg := &sync.WaitGroup{}
	activeChildren := atomic.Int64{}
	for _, child := range recursive {
		fullPath := filepath.Join(path, child.Name)
		// err := scanDir(ctx, fullPath, child, options)
		// if err != nil {
		// 	return err
		// }
		activeJobs.Add(1)
		// cwg.Add(1)
		activeChildren.Add(1)
		// jobs <- job{path: fullPath, node: child, wg: cwg}
		jobs <- job{path: fullPath, node: child, activeSiblings: &activeChildren}
	}

	if len(recursive) < 1 {
		data.mu.Lock()
		node.Temp = 0
		data.mu.Unlock()
	}

	// cwg.Wait()

	// data.mu.Lock()
	// node.Temp = 0
	// data.mu.Unlock()

	// helpers.TempPrinAsJson(data.result)
	// helpers.TempPrinAsJson(data.devInodes)
	return nil
}

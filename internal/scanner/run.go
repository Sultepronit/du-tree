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
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

func handleReadDir(path string, node *dirNode) ([]os.DirEntry, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		if os.IsPermission(err) {
			fmt.Println("no permission!")
			data.scanMu.Lock()
			node.Locked = -1
			node.Temp = 0

			for p := node.Parent; p != nil; p = p.Parent {
				p.Locked++
			}
			data.scanMu.Unlock()
			return nil, nil
		} else if os.IsNotExist(err) {
			fmt.Println("Disappeared!", path)
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

func getSizeEtc(entry os.DirEntry, info fs.FileInfo, stat *syscall.Stat_t, reqBlockSize bool, path string) sizeAttr {
	s := sizeAttr{}
	if reqBlockSize {
		s.size = stat.Blocks * 512
	} else if !entry.IsDir() {
		s.size = info.Size()
	}

	if stat.Nlink > 1 && !entry.IsDir() {
		s.dev = stat.Dev
		s.ino = stat.Ino
		s.path = path
	}

	return s
}

func calcSize(sizes []sizeAttr) int64 {
	var sum int64
	locked := false
	for _, s := range sizes {
		if s.ino != 0 {
			if !locked {
				locked = true

				start := time.Now()
				data.inodesMu.Lock()
				dur := time.Since(start)
				atomic.AddInt64(&waited3, dur.Nanoseconds())

			}

			if data.devInodes[s.dev] == nil {
				data.devInodes[s.dev] = make(map[uint64]string)
				data.devInodes[s.dev][s.ino] = s.path
			} else if data.devInodes[s.dev][s.ino] == "" {
				data.devInodes[s.dev][s.ino] = s.path
			} else { // the inode is counted already
				continue
			}
		}

		sum += s.size
	}

	if locked {
		data.inodesMu.Unlock()
	}
	return sum
}

// func prepareDir(dirs []*dirNode, entry os.DirEntry, parent *dirNode, size int64, fullPath string, t int64) []*dirNode {
func prepareDir(entry os.DirEntry, parent *dirNode, size int64, fullPath string, t int64) *dirNode {
	if !entry.IsDir() {
		// return dirs
		return nil
	}

	dir := dirNode{
		Parent:   parent,
		Name:     entry.Name(),
		Size:     size,
		ScanTime: t,
		Temp:     2,
	}

	status := explorer.CheckDirStatus(fullPath)
	// if status == explorer.NotFound {
	// 	return dirs
	// }

	switch status {
	case explorer.NotFound:
		return nil
	case explorer.Empty:
		dir.Temp = 0
	case explorer.Forbidden:
		dir.Temp = 0
		dir.Locked = -1

		// data.scanMu.Lock()
		// fmt.Println("locked!")
		// for p := parent; p != nil; p = p.Parent {
		// 	p.Locked++
		// }
		// data.scanMu.Unlock()
	}

	// return append(dirs, &child)
	return &dir
}

// var sem = make(chan struct{}, runtime.NumCPU()*3)

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
	locked := 0

	sizes := make([]sizeAttr, 0, len(entries))

	scanT := time.Now().UnixMilli()

	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())

		if exc := exculde(options, fullPath, entry.Name()); exc {
			continue
		}

		info, stat, err := getFileInfo(entry)
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

		sizeEtc := getSizeEtc(entry, info, stat, options.BlockSize, fullPath)

		// dirsOversized = prepareDir(dirsOversized, entry, node, sizeEtc.size, fullPath, scanT)
		child := prepareDir(entry, node, sizeEtc.size, fullPath, scanT)
		if child != nil {
			dirsOversized = append(dirsOversized, child)
			if child.Locked == -1 {
				locked++
			}
		}

		sizes = append(sizes, sizeEtc)
	}

	dirs := make([]*dirNode, len(dirsOversized))
	recursive := make([]*dirNode, 0, len(dirsOversized))
	copy(dirs, dirsOversized)

	for _, d := range dirs {
		if d.Temp > 0 {
			recursive = append(recursive, d)
		}
	}

	// var dirContSize int64
	// locked := false
	// for _, s := range sizes {
	// 	if s.ino != 0 {
	// 		if !locked {
	// 			locked = true
	// 			data.inodesMu.Lock()
	// 		}

	// 		if data.devInodes[s.dev] == nil {
	// 			data.devInodes[s.dev] = make(map[uint64]string)
	// 			data.devInodes[s.dev][s.ino] = s.path
	// 		} else if data.devInodes[s.dev][s.ino] == "" {
	// 			data.devInodes[s.dev][s.ino] = s.path
	// 		} else { // the inode is counted already
	// 			continue
	// 		}
	// 	}

	// 	dirContSize += s.size
	// }

	// if locked {
	// 	data.inodesMu.Unlock()
	// }

	dirContSize := calcSize(sizes)

	// data.scanMu.Lock()
	start := time.Now()
	data.scanMu.Lock()
	dur := time.Since(start)
	atomic.AddInt64(&waited1, dur.Nanoseconds())

	if dirContSize > 0 {
		for n := node; n != nil; n = n.Parent {
			n.Size += dirContSize
		}
	}

	if locked > 0 {
		for n := node; n != nil; n = n.Parent {
			n.Locked += locked
		}
	}

	node.Dirs = dirs
	node.ScanTime = scanT
	node.Temp = 1

	data.scanMu.Unlock()

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

	start = time.Now()
	data.scanMu.Lock()
	dur = time.Since(start)
	atomic.AddInt64(&waited, dur.Nanoseconds())
	// atomic.AddInt64(&waited, dur.Milliseconds())
	node.Temp = 0
	data.scanMu.Unlock()

	// helpers.TempPrinAsJson(data.result)
	// helpers.TempPrinAsJson(data.devInodes)
	return nil
}

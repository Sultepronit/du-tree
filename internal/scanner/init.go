package scanner

import (
	"context"
	"du-tree/internal/models"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"
	"time"
)

var rootDev uint64

func getRoot(target string) (size int64, err error) {
	info, err := os.Lstat(target)
	if err != nil {
		return 0, err
	}
	if stat, ok := info.Sys().(*syscall.Stat_t); ok {
		rootDev = stat.Dev
		fmt.Println("root dev:", rootDev)
		return stat.Blocks * 512, nil
	}

	return 0, errors.New("no syscall.Stat_t")
}

func Init(req models.Request) (*models.Node, error) {
	if !strings.HasSuffix(req.Path, "/") {
		req.Path += "/"
	}
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
	// data.inodes = make(map[uint64]string)
	data.devInodes = make(map[uint64]map[uint64]string)
	data.scanTree = &dirNode{Temp: 2}
	data.viewTree = &viewNode{dirNode: data.scanTree}

	if req.Options.BlockSize || req.Options.OneFS {
		rootSize, err := getRoot(data.request.Path)
		if err != nil {
			fmt.Println("init/getRootBlockSize:", err)
			// data.mu.Unlock()
			// return nil, nil
		}
		if req.Options.BlockSize {
			data.scanTree.Size = rootSize
		}

	}
	data.mu.Unlock()

	go func() {
		// err := scanDir(ctx, data.request.Path, data.scanTree, req.Options.BlockSize)
		err := scanDir(ctx, data.request.Path, data.scanTree, req.Options)
		if err != nil {
			fmt.Println("init/scanDir:", err)
		}

		data.mu.Lock()
		data.cancel = nil
		// helpers.TempPrinAsJson(data.devInodes)
		log.Println("Total:", data.scanTree.Size)
		data.mu.Unlock()
	}()

	// helpers.TempPrinAsJson(data.scanTree)
	time.Sleep(time.Millisecond * 100)
	return PresentDir("", req.Pages)
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

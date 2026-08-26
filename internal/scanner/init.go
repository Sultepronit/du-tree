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
		// fmt.Println("root dev:", rootDev)
		return stat.Blocks * 512, nil
	}

	return 0, errors.New("no syscall.Stat_t")
}

var waited1 int64
var waited int64
var waited3 int64

// func Init(req models.Request) (*models.Node, error) {
func Init(req models.Request) (*models.Branch, error) {
	if !strings.HasSuffix(req.Path, "/") {
		req.Path += "/"
	}
	log.Println("Scanning:", req.Path)
	start := time.Now()
	data.scanMu.Lock()
	data.viewMu.Lock()
	data.inodesMu.Lock()

	if data.cancel != nil {
		log.Println("Previous scan is still running!")
		// return?
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
		// rootSize, err := getRoot(data.request.Path)
		rootSize, err := getRoot(req.Path)
		if err != nil {
			fmt.Println("init/getRootBlockSize:", err)
		}
		if req.Options.BlockSize {
			data.scanTree.Size = rootSize
		}

	}
	data.scanMu.Unlock()
	data.viewMu.Unlock()
	data.inodesMu.Unlock()

	go func() {
		// err := scanDir(ctx, data.request.Path, data.scanTree, req.Options)
		err := scanDir(ctx, req.Path, data.scanTree, req.Options)
		if err != nil {
			fmt.Println("init/scanDir:", err)
		}

		data.scanMu.Lock()
		data.cancel = nil
		// helpers.TempPrinAsJson(data.devInodes)
		log.Printf("Total: %dB (%s)", data.scanTree.Size, time.Since(start))
		data.scanMu.Unlock()
		fmt.Println(waited1/1000000, "ms")
		fmt.Println(waited/1000000, "ms")
		fmt.Println(waited3/1000000, "ms")
	}()

	// helpers.TempPrinAsJson(data.scanTree)
	time.Sleep(time.Millisecond * 100)
	// return PresentDir("", req.Pages)
	return PresentDir("", req)
}

func Stop() {
	data.scanMu.Lock()
	defer data.scanMu.Unlock()

	if data.cancel != nil {
		log.Println("Stopping scan...")
		data.cancel()
		data.cancel = nil
	} else {
		log.Println("No scan is currently running.")
	}
}

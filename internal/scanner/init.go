package scanner

import (
	"context"
	"du-tree/internal/models"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"sync/atomic"
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

type job struct {
	path string
	node *dirNode
	// wg   *sync.WaitGroup
	activeSiblings *atomic.Int64
}

var jobs chan job
var activeJobs atomic.Int32

func useParalel(rootPath string, node *dirNode, ctx context.Context, options models.ReqOptions) {
	numWorekrs := 4
	// numWorekrs := 400
	// jobs := make(chan string, 1000)
	// jobs := make(chan job, 1000)
	jobs = make(chan job, 1000)
	// var activeJobs atomic.Int32
	activeJobs = atomic.Int32{}
	activeJobs.Add(1)

	var wg sync.WaitGroup
	// var wg2 sync.WaitGroup
	// wg2.Add(1)

	as := atomic.Int64{}
	as.Add(1)
	// jobs <- rootPath
	// jobs <- job{path: rootPath, node: node, wg: &sync.WaitGroup{}}
	// jobs <- job{path: rootPath, node: node, wg: &wg2}
	jobs <- job{path: rootPath, node: node, activeSiblings: &as}

	for range numWorekrs {
		wg.Add(1)
		go worker(jobs, &activeJobs, &wg, ctx, options)
	}

	wg.Wait()
	fmt.Println("Jobs done!")
}

// func worker(jobs chan string, activeJobs *atomic.Int32, wg *sync.WaitGroup, ctx context.Context, options models.ReqOptions) {
func worker(jobs chan job, activeJobs *atomic.Int32, wg *sync.WaitGroup, ctx context.Context, options models.ReqOptions) {
	defer wg.Done()

	// for path := range jobs {
	for j := range jobs {
		// err := scanDir(ctx, j.path, j.node, options, j.wg)
		err := scanDir(ctx, j.path, j.node, options, j.activeSiblings)
		if err != nil {
			fmt.Println("init/scanDir:", err)
		}

		remaining := activeJobs.Add(-1)
		// fmt.Println("jobs:", remaining)

		if remaining == 0 {
			close(jobs)
		}
	}
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
		// err := scanDir(ctx, data.request.Path, data.scanTree, req.Options)
		// if err != nil {
		// 	fmt.Println("init/scanDir:", err)
		// }

		useParalel(req.Path, data.scanTree, ctx, req.Options)

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

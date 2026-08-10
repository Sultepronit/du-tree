package scanner

import (
	"du-tree/internal/explorer"
	"du-tree/internal/models"
	"fmt"
	"log"
	"time"
)

func InitCLI(path string, options models.ReqOptions) {
	if path == "" {
		return
	}
	time.Sleep(time.Millisecond * 20)

	status := explorer.CheckDirStatus(path)

	if status == explorer.Forbidden {
		log.Println("Failed to scan:", path)
		fmt.Println("You do not have permission to access this directory! Run as root to gain access.")
		return
	}

	checked := explorer.CheckPath(path+"/", true)
	working := checked.InputPath
	if checked.WorkingPath != "" {
		working = checked.WorkingPath
	}

	if status == explorer.NotFound {
		log.Println("Failed to scan:", path)
		fmt.Println("Path is available up to:", working)
		return
	}

	Init(models.Request{
		Path:    working,
		Pages:   1,
		Options: options,
	})
}

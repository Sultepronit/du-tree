package scanner

import (
	"du-tree/internal/explorer"
	"du-tree/internal/models"
	"fmt"
	"log"
	"time"
)

func InitCLI(path string, apparentSize bool) {
	if path == "" {
		return
	}
	time.Sleep(time.Millisecond * 20)
	// fmt.Println(path)
	// path += "/"
	checked := explorer.CheckPath2(path + "/")
	// helpers.TempPrinAsJson(checked)
	// fmt.Println(checked.InputPath)
	// fmt.Println(checked.WorkingPath)

	working := checked.InputPath
	if checked.WorkingPath != "" {
		working = checked.WorkingPath
	}
	if checked.IsLocked {
		log.Println("Failed to scan:", working)
		fmt.Println("You do not have permission to access this directory! Run as root to gain access.")
		return
	} else if !explorer.IsAccessible(path, "") {
		log.Println("Failed to scan:", path)
		fmt.Println("Path exists up to:", working)
		return
	}

	Init(models.Request{
		Path:    working,
		Pages:   1,
		Options: models.ReqOptions{BlockSize: !apparentSize},
	})
}

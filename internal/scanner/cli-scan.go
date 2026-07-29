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
	fmt.Println(path)
	// path += "/"
	checked := explorer.CheckPath2(path + "/")
	// helpers.TempPrinAsJson(checked)
	cleaned := checked.WorkingPath
	if cleaned == "" {
		cleaned = checked.InputPath
	}
	if checked.IsLocked {
		log.Println("Failed to scan:", cleaned)
		fmt.Println("You do not have permission to access this directory! Run as root to gain access.")
		return
	} else if !explorer.IsAccessible(path, "") {
		log.Println("Failed to scan:", path)
		fmt.Println("Path exists up to:", cleaned)
		return
	}

	Init(models.Request{
		Path:    cleaned,
		Pages:   1,
		Options: models.ReqOptions{BlockSize: !apparentSize},
	})
}

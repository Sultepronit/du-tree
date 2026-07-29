package main

import (
	"du-tree/internal/explorer"
	"du-tree/internal/models"
	"du-tree/internal/scanner"
	"du-tree/internal/server"
	"flag"
	"fmt"
	"path/filepath"
	"time"
)

func main() {
	port := flag.String("p", "51200", "The server port")
	path := flag.String("s", "", "The scan path")
	apparentSize := flag.Bool("A", false, "To get apparent size of files instead of the default block size")
	flag.Parse()

	fmt.Println(filepath.Abs("~"))
	fmt.Println(explorer.IsAccessible("~", ""))
	if *path != "" {
		fmt.Println(filepath.Abs(*path))
		fmt.Println(explorer.IsAccessible(*path, ""))
		go func() {
			time.Sleep(time.Millisecond * 20)
			scanner.Init(models.Request{
				Path:    *path,
				Pages:   1,
				Options: models.ReqOptions{BlockSize: !*apparentSize},
			})
		}()
	}

	// fmt.Println(os.Hostname())

	server.Start(*port)
}

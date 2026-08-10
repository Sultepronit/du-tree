package main

import (
	"du-tree/internal/models"
	"du-tree/internal/scanner"
	"du-tree/internal/server"
	"flag"
	"fmt"
	"strings"
)

type arrayFlags []string

func (i *arrayFlags) String() string {
	return strings.Join(*i, ", ")
}

func (i *arrayFlags) Set(value string) error {
	*i = append(*i, value)
	return nil
}

func main() {
	// v := flag.Bool("v", false, "Print version")
	port := flag.String("p", "51200", "The server port")
	path := flag.String("s", "", "The scan path")
	apparentSize := flag.Bool("A", false, "Apparent size of files (instead of the default block size = actual disk usage)")
	excludeHidden := flag.Bool("E", false, "Exclude hidden items")
	oneFs := flag.Bool("O", false, "One FS (skip directories (&files) on different file systems)")

	var exPatt arrayFlags
	flag.Var(&exPatt, "e", "Exclude pattern (can be used multiple times)")
	flag.Parse()

	fmt.Println(exPatt)

	// if *v {
	// 	fmt.Println("version!")
	// 	return
	// }

	go scanner.InitCLI(*path, models.ReqOptions{
		BlockSize:     !*apparentSize,
		ExcludeHidden: *excludeHidden,
		OneFS:         *oneFs,
		ExPatt:        exPatt,
	})

	server.Start(*port)
}

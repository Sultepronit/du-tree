package main

import (
	"du-tree/internal/scanner"
	"du-tree/internal/server"
	"flag"
)

func main() {
	port := flag.String("p", "51200", "The server port")
	path := flag.String("s", "", "The scan path")
	apparentSize := flag.Bool("A", false, "To get the apparent size of files instead of the default block size")
	flag.Parse()

	go scanner.InitCLI(*path, *apparentSize)

	// fmt.Println(os.Hostname())

	server.Start(*port)
}

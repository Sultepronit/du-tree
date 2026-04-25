package main

import (
	"du-tree/explorer"
	"du-tree/server"
)

func main() {
	explorer.ReadDir("/")
	server.Start()
}

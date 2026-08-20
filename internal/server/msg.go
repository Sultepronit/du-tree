package server

import (
	"du-tree/internal/utils"
	"fmt"
)

var version = "~"

func printMsg(port string) {
	url := "http://localhost:" + port
	fmt.Printf("DU-Tree v%s started. Open Web UI:\n\033[36m%s\033[0m", version, url)

	ip, err := utils.GetLocalIP()
	if err != nil {
		fmt.Println("\n" + err.Error())
		return
	} else {
		fmt.Printf("\t\033[36mhttp://%s:%s\033[0m\n", ip, port)
	}

	fmt.Print("\033[3mTo exit press \033[0mCtrl+C\n\n")
}

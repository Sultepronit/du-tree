//go:build !production

package server

import (
	"du-tree/internal/dev"
	"du-tree/internal/models"
	"du-tree/internal/utils"
	"log"
	"net/http"
)

var systemContext models.SystemContext

func Start(port string) {
	systemContext = utils.GetSystemContext()

	http.HandleFunc("/init", handleInit)
	// http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleScan)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)
	http.HandleFunc("/exit", handleExit)

	dev.InitDevHandlers(version)
	http.HandleFunc("/", dev.DevHandler)

	if port == "51200" {
		port = "51201"
	}

	printMsg(port)

	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

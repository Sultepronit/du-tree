//go:build production

package server

import (
	"du-tree/internal/embeded"
	"log"
	"net/http"
)

func Start(port string) {
	http.HandleFunc("/init", handleInit)
	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleScan)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)
	http.HandleFunc("/exit", handleExit)

	fs := embeded.GetSubFSHandler()
	http.Handle("/", fs)

	printMsg(port)

	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

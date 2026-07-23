//go:build production

package server

import (
	"du-tree/internal/embeded"
	"log"
	"net/http"
)

func Start() {
	http.HandleFunc("/init", handleInit)
	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleScan)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)

	// fs := http.FileServer(http.Dir("./ui"))
	fs := embeded.GetSubFSHandler()
	http.Handle("/", fs)

	port := "51200"

	log.Printf("Listening on port: %s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

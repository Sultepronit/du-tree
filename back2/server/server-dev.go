//go:build !production

package server

import (
	"du-tree/jscss"
	"log"
	"net/http"
)

func Start() {
	go jscss.StartCSSWhatcher("../front2/style")
	http.HandleFunc("/sse-css", jscss.SseHandler)

	http.HandleFunc("/init", handleInit)
	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleScan)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)

	http.HandleFunc("/main.js", jscss.UseEsbuild)
	fs := http.FileServer(http.Dir("../front2"))
	http.Handle("/", fs)

	port := "51200"

	log.Printf("Dev TS Server started at: %s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

//go:build !production

package server

import (
	"du-tree/jscss"
	"log"
	"net/http"
)

func Start() {
	// prepareProxy()
	go jscss.StartCSSWhatcher("../front2/style")
	http.HandleFunc("/sse-css", jscss.SseHandler)

	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleDir)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)

	// http.Handle("/", proxy)

	// http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	// 	log.Printf("Proxying request: %s %s", r.Method, r.URL.Path)
	// 	proxy.ServeHTTP(w, r)
	// })

	http.HandleFunc("/main.js", jscss.UseEsbuild)
	// http.HandleFunc("/main.ts", useEsbuild)
	fs := http.FileServer(http.Dir("../front2"))
	http.Handle("/", fs)

	port := "51200"

	log.Printf("Dev TS Server started at: %s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

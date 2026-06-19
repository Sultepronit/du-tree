//go:build !production

package server

import (
	"fmt"
	"log"
	"net/http"
)

func handleHello(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path, "as /")
	fmt.Fprintln(w, "Hello there!")
}

func Start() {
	prepareProxy()

	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)

	// http.Handle("/", proxy)

	// http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	// 	log.Printf("Proxying request: %s %s", r.Method, r.URL.Path)
	// 	proxy.ServeHTTP(w, r)
	// })

	http.HandleFunc("/main.js", useEsbuild)
	http.HandleFunc("/main.ts", useEsbuild)
	fs := http.FileServer(http.Dir("../front2"))
	// http.Handle("/dev", fs)
	http.Handle("/", fs)

	// http.HandleFunc("/", handleHello)
	port := "51200"

	log.Printf("Dev TS Server started at: %s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

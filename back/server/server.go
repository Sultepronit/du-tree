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
	// http.HandleFunc("/du-exec", handleDuExec)
	// http.HandleFunc("/get-branch", handleBranch)
	// http.HandleFunc("/get-part", handlePart)
	
	http.HandleFunc("POST /dir", handleDir)
	// http.HandleFunc("/dir", handleDir)

	http.HandleFunc("/", handleHello)
	port := "8088"

	log.Printf("Listening on port: %s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

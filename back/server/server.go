package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func sendResult(w http.ResponseWriter, res any) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(res)
	if err != nil {
		log.Println(err)
		http.Error(w, "JSON encode error", http.StatusInternalServerError)
	}
}

// func handleDuExec(w http.ResponseWriter, r *http.Request) {
// 	log.Println(r.URL.Path)
// 	p := r.URL.Query().Get("path")
// 	log.Println("path:", p)

// 	re := du2(p)
// 	sendResult(w, re)
// }

// func handlePart(w http.ResponseWriter, r *http.Request) {
// 	log.Println(r.URL.Path)
// 	sendResult(w, instantRoot)
// }

// func handleBranch(w http.ResponseWriter, r *http.Request) {
// 	log.Println(r.URL.Path)
// 	p := r.URL.Query().Get("path")
// 	log.Println("path:", p)

// 	// re := getCachedBranch([]string{"a"})
// 	re := getCachedBranch(strings.Split(p, "/"))

// 	w.Header().Set("Access-Control-Allow-Origin", "*")
// 	w.Header().Set("Content-Type", "application/json")
// 	err := json.NewEncoder(w).Encode(re)
// 	if err != nil {
// 		log.Println(err)
// 		http.Error(w, "JSON encode error", http.StatusInternalServerError)
// 	}
// }

func handleHello(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path)
	fmt.Fprintln(w, "Hello there!")
}

func Start() {
	// http.HandleFunc("/du-exec", handleDuExec)
	// http.HandleFunc("/get-branch", handleBranch)
	// http.HandleFunc("/get-part", handlePart)
	http.HandleFunc("/", handleHello)
	port := "8088"

	log.Printf("Listening on port: %s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

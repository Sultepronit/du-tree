package server

import (
	"du-tree/du"
	"du-tree/explorer"
	"du-tree/models"
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

func handleDir(w http.ResponseWriter, r *http.Request) {
	// log.Println("dir handler!")
	log.Println(r.URL.Path)
	// log.Println(r.Method)
	// log.Println(r.Body)
	// sendResult(w, "success!")
	var req models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Bad JSON:", err)
		http.Error(w, "Bad JSON", 400)
		return
	}
	fmt.Println(req)
	// sendResult(w, req)
	re, err := explorer.ReadDir(req.Path)
	if err != nil { // temp!
		// log.Fatal(err)
		log.Println(err)
	}
	sendResult(w, re)

	if req.InitDu {
		go du.Init(req.Path)
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

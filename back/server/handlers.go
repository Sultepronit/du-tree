package server

import (
	"du-tree/du"
	"du-tree/models"
	// "du-tree/explorer"
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
	log.Println(r.URL.Path)
	var req models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Bad JSON:", err)
		http.Error(w, "Bad JSON", 400)
		return
	}
	fmt.Println(req)

	if req.InitDu {
		// go du.Init(req.Path)
		go du.Init(req.Path, req.Comm)
	}

	// sendResult(w, req)
	// re, err := explorer.ReadDir(req.Path)
	re, err := du.GetDir(req.Path)
	if err != nil { // temp!
		// log.Fatal(err)
		log.Println(err)
	}
	sendResult(w, re)
}

func handleUpdate(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path)
	sendResult(w, du.GetUpdate())
}

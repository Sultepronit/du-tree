package server

import (
	"du-tree/du"
	"du-tree/explorer"
	"du-tree/models"
	"du-tree/scan"
	"os"

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

func checkUser(w http.ResponseWriter, _ *http.Request) {
	sendResult(w, map[string]bool{"root": os.Getuid() == 0})
}

func checkPath(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path)

	var req models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad JSON", 400)
		return
	}
	// fmt.Println(req)

	sendResult(w, explorer.CheckPath(req.Path))
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

	// if req.InitDu {
	if req.Command != nil {
		// du.Start(req.Path, req.Command, req.Options)
		// time.Sleep(time.Millisecond * 10)
		scan.Init(req)
	}

	// sendResult(w, req)
	// re, err := explorer.ReadDir(req.Path)
	re, err := du.GetDir(req.Path, req.Pages)
	if err != nil { // temp!
		// log.Fatal(err)
		log.Println(err)
	}
	sendResult(w, re)
}

func handleUpdate(w http.ResponseWriter, r *http.Request) {
	// log.Println(r.URL.Path)
	// var req []string
	var req []models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Bad JSON:", err)
		http.Error(w, "Bad JSON", 400)
		return
	}
	fmt.Println(req)
	sendResult(w, du.GetUpdate(req))
}

func handleCancel(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path)
	du.Stop()
	sendResult(w, map[string]string{"status": "canceled"})
}

package server

import (
	"du-tree/internal/explorer"
	"du-tree/internal/models"
	"du-tree/internal/scanner"
	"os"
	"time"

	"encoding/json"
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

// var systemContext models.SystemContext

func handleInit(w http.ResponseWriter, _ *http.Request) {
	// sendResult(w, scanner.GetState())
	sendResult(w, struct {
		Scan    models.Request       `json:"scan"`
		Context models.SystemContext `json:"context"`
	}{
		scanner.GetState(),
		systemContext,
	})
}

func checkPath(w http.ResponseWriter, r *http.Request) {
	// log.Println(r.URL.Path)

	var req models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad JSON", 400)
		return
	}
	// fmt.Println(req)

	sendResult(w, explorer.CheckPath(req.Path, false))
}

func handleScan(w http.ResponseWriter, r *http.Request) {
	// log.Println(r.URL.Path)
	var req models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad JSON", 400)
		return
	}
	// fmt.Println(req)

	re, err := scanner.Init(req)
	if err != nil {
		log.Println("Scan failed:", err)
	}
	sendResult(w, re)
}

func handleDir(w http.ResponseWriter, r *http.Request) {
	// log.Println(r.URL.Path)
	var req models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad JSON", 400)
		return
	}
	// fmt.Println(req)

	re, err := scanner.PresentDir(req.Path, req.Pages)
	if err != nil {
		log.Println(err)
	}
	sendResult(w, re)
}

func handleUpdate(w http.ResponseWriter, r *http.Request) {
	// log.Println(r.URL.Path)
	var req []models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad JSON", 400)
		return
	}
	// fmt.Println(req)
	// sendResult(w, du.GetUpdate(req))
	sendResult(w, scanner.GetUpdate(req))
}

func handleCancel(w http.ResponseWriter, r *http.Request) {
	// log.Println(r.URL.Path)
	// du.Stop()
	scanner.Stop()
	sendResult(w, map[string]string{"status": "canceled"})
}

func handleExit(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("exiting"))

	log.Println("Received exit signal from Web UI. Gracefully exiting...")

	go func() {
		time.Sleep(100 * time.Millisecond)
		os.Exit(0)
	}()
}

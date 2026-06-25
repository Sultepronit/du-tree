package jscss

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
)

var cssChan = make(chan string)

func StartCSSWhatcher(path string) {
	wcr, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal("fsnotify:", err)
	}
	defer wcr.Close()

	var isWaiting bool

	go func() {
		for {
			select {
			case event, ok := <-wcr.Events:
				if !ok {
					return
				}
				if event.Has(fsnotify.Write) {
					if isWaiting {
						continue
					}

					log.Println("CSS file changed:", event.Name)
					isWaiting = true

					select {
					case cssChan <- filepath.Base(event.Name):
					default:
					}

					time.AfterFunc(100*time.Millisecond, func() { isWaiting = false })
				}
			case err, ok := <-wcr.Errors:
				if !ok {
					return
				}
				log.Println("css whatcher error:", err)
			}
		}
	}()

	err = wcr.Add(path)
	if err != nil {
		log.Fatal("fatal start:", err)
	}

	select {}
}

func SseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	flusher, ok := w.(http.Flusher)
	if !ok {
		log.Println("Streaming is broken!")
		http.Error(w, "Streaming is broken", http.StatusInternalServerError)
		return
	}
	log.Println("SSE is active!")

	for {
		select {
		case fileName := <-cssChan:
			fmt.Fprintf(w, "event: css-update\ndata: %s\n\n", fileName)
			flusher.Flush()
		case <-r.Context().Done():
			log.Println("Browser disconnected")
			return
		}
	}
}

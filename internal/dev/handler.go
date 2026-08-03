package dev

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

var fsHandler http.Handler
var version = "~~"

func InitDevHandlers(v string) {
	go StartCSSWhatcher("./web-gui/style")
	fsHandler = http.FileServer(http.Dir("./web-gui"))
	version = v
}

func parseHtml() string {
	htmlBytes, err := os.ReadFile("./web-gui/index.html")
	if err != nil {
		log.Printf("Error reading index.html: %v", err)
		// http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return "Error reading index.html"
	}
	html := strings.Replace(string(htmlBytes), "app-v{{VERSION}}.css", "style/app.css", 1)
	html = strings.Replace(html, "{{VERSION}}", version, 2)

	return html
}

func DevHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Write([]byte(parseHtml()))
	} else if r.URL.Path == "/sse-css" {
		http.HandleFunc("/sse-css", SseHandler)
	} else if r.URL.Path == "/style/app.css" {
		w.Header().Set("Content-Type", "text/css")
		w.Write(ParseCSS())
	} else if strings.HasSuffix(r.URL.Path, ".js") {
		w.Header().Set("Content-Type", "application/javascript")
		w.Write(ParseTS())
	} else {
		fmt.Println(r.URL.Path)
		fsHandler.ServeHTTP(w, r)
	}
}

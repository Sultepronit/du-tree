package server

import (
	"log"
	"net/http/httputil"
	"net/url"
)

var proxy *httputil.ReverseProxy

func prepareProxy() {
	// target, err := url.Parse("http://localhost:5173")
	target, err := url.Parse("http://10.88.0.3:5173/")
	if err != nil {
		log.Println(err)
	}

	proxy = httputil.NewSingleHostReverseProxy(target)
}

// func useEsbuild(w http.ResponseWriter, r *http.Request) {
// 	http.Handle("/", proxy)
// }

// http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
// 	log.Printf("Proxying request: %s %s", r.Method, r.URL.Path)
// 	proxy.ServeHTTP(w, r)
// })

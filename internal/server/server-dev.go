//go:build !production

package server

import (
	"du-tree/internal/jscss"
	"fmt"
	"log"
	"net/http"
)

func Start(port string) {
	go jscss.StartCSSWhatcher("./ui/style")
	http.HandleFunc("/sse-css", jscss.SseHandler)
	http.HandleFunc("/main.js", jscss.UseEsbuild)

	http.HandleFunc("/init", handleInit)
	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleScan)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)
	http.HandleFunc("/exit", handleExit)

	fs := http.FileServer(http.Dir("./ui"))
	http.Handle("/", fs)

	if port == "51200" {
		port = "51201"
	}
	url := "http://localhost:" + port
	fmt.Printf("Dev du-tree server started. Open Web UI: \033[36m%s\033[0m\n", url)
	fmt.Print("\033[3mTo exit press Ctrl+C\033[0m\n\n")

	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

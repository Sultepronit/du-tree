//go:build production

package server

import (
	"du-tree/internal/embeded"
	"log"
	"net/http"
)

func Start(port string) {
	http.HandleFunc("/init", handleInit)
	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleScan)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)
	http.HandleFunc("/exit", handleExit)

	fs := embeded.GetSubFSHandler()
	http.Handle("/", fs)

	// url := "http://localhost:" + port
	// fmt.Printf("du-tree server started. Open Web UI: \033[36m%s\033[0m\n", url)
	// fmt.Print("\033[3mTo exit press Ctrl+C\033[0m\n\n")
	printMsg(port)

	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

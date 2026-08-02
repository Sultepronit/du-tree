//go:build !production

package server

import (
	"du-tree/internal/dev"
	"log"
	"net/http"
	"os"
	"strings"
)

// func printMsg(port string) {
// 	url := "http://localhost:" + port
// 	fmt.Printf("Dev du-tree server started. Open Web GUI:\n\033[36m%s\033[0m", url)

// 	ip, err := utils.GetLocalIP()
// 	if err != nil {
// 		fmt.Println("\n" + err.Error())
// 		return
// 	} else {
// 		fmt.Printf("\t\033[36mhttp://%s:%s\033[0m\n", ip, port)
// 	}

// 	fmt.Print("\033[3mTo exit press \033[0mCtrl+C\n\n")
// }

func Start(port string) {
	go dev.StartCSSWhatcher("./web-gui/style")
	http.HandleFunc("/sse-css", dev.SseHandler)
	// http.HandleFunc("/main.js", dev.UseEsbuild)
	// http.HandleFunc("/style.css", dev.UseEsbuild)

	http.HandleFunc("/init", handleInit)
	http.HandleFunc("/user", checkUser)
	http.HandleFunc("POST /path", checkPath)
	http.HandleFunc("POST /scan", handleScan)
	http.HandleFunc("POST /dir", handleDir)
	http.HandleFunc("POST /update", handleUpdate)
	http.HandleFunc("/cancel", handleCancel)
	http.HandleFunc("/exit", handleExit)

	// fs := http.FileServer(http.Dir("./web-gui"))
	styleFs := http.FileServer(http.Dir("./web-gui/style"))
	// http.Handle("/", fs)
	// jsCss, errMsg := dev.ParseTS()
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			htmlBytes, err := os.ReadFile("./web-gui/index.html")
			if err != nil {
				log.Printf("Error reading index.html: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
			html := strings.ReplaceAll(string(htmlBytes), "{{VERSION}}", `0.2.0-dev.2`)
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Write([]byte(html))
			// http.ServeFile(w, r, "./web-gui/index.html")
		} else {
			if strings.HasSuffix(r.URL.Path, ".js") {
				w.Header().Set("Content-Type", "application/javascript")
				w.Write(dev.ParseTS())
				return
			} else if strings.HasSuffix(r.URL.Path, ".css") {
				w.Header().Set("Content-Type", "text/css")
				w.Write(dev.ParseCSS())
				return
			}
			// fs.ServeHTTP(w, r)
			styleFs.ServeHTTP(w, r)
		}
	})

	if port == "51200" {
		port = "51201"
	}

	printMsg(port)

	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

package main

import "os"

func saveFile(name, text string) {
	err := os.WriteFile(name, []byte(text), 0644)
	if err != nil {
		panic(err)
	}
}

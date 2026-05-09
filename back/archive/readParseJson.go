package main

import (
	"encoding/json"
	"os"
)

func readParseJson(file string, target any) error {
	f, err := os.Open(file)
	if err != nil {
		return err
	}
	defer f.Close()

	return json.NewDecoder(f).Decode(target)
}

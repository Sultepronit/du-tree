package main

import (
	"encoding/json"
	"fmt"
)

func prinAsJson(input any) {
	j, err := json.MarshalIndent(input, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(j))
}

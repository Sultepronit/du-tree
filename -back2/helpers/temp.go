package helpers

import (
	"encoding/json"
	"fmt"
)

func TempPrinAsJson(input any) {
	j, err := json.MarshalIndent(input, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(j))
}

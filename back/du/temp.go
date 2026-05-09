package du

import (
	"encoding/json"
	"fmt"
)

func tempPrinAsJson(input any) {
	j, err := json.MarshalIndent(input, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(j))
}

package explorer

import (
	"fmt"
	"os"
)

func ReadDir(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	for _, e := range entries {
		fmt.Println(e)
		fmt.Println(e.Type())
		info, err := e.Info()
		if err != nil {
			return err
		}
		fmt.Printf("%+v\n", info)

	}
	return nil
}

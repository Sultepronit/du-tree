package explorer

import (
	"du-tree/models"
	"os"
)

func ReadDir(path string) ([]*models.Node, error) {
	re := make([]*models.Node, 0, 10)
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	for _, e := range entries {
		var node models.Node
		re = append(re, &node)
		// fmt.Println(e)

		// fmt.Println(e.Name())
		// fmt.Print(e.Type().String())
		node.Name = e.Name()
		// runes := []rune(e.Type().String())
		// fmt.Println(runes)
		// fmt.Println(e.Type().String()[0:1])
		node.Type = e.Type().String()[0:1]
		// if node.Type != "----------" {
		// if node.Type == "d---------" {
		// if node.Type == "d" {
		if e.IsDir() {
			node.SizeIsTemp = true
			continue
		} else if node.Type == "L" {
			typ, realPath := getRealEntity(path, node.Name)
			node.Name += "/" + typ + "/" + realPath
		}
		// fmt.Println(e.Type().IsRegular())
		// fmt.Println(e.Type().Perm())
		info, err := e.Info()
		if err != nil {
			return nil, err
		}
		// fmt.Printf("%+v\n", info.Mode())
		// fmt.Println(info.Mode())
		// fmt.Println(info.Size())
		node.Size = info.Size()
		// fmt.Println(info.Sys())
		// fmt.Printf("%+v\n", info.Sys())
		// fmt.Printf("%+v\n", node)
	}
	// fmt.Printf("%+v\n", re)
	// j, err := json.MarshalIndent(re, " ", " ")
	// fmt.Println(string(j), err)

	return re, nil
}

package du

import (
	"du-tree/explorer"
	"du-tree/models"
	"fmt"
	"strings"
)

// func GetDir(path string) ([]*models.Node, error) {
func GetDir(path string) (*models.Node, error) {
	baceCont, err := explorer.ReadDir(path)
	if err != nil {
		return nil, err
	}

	allParts := strings.Split(path, "/")
	parts := allParts[discardIndex:]
	dure := tree2.getDir(strings.Join(parts, "/"))

	dureCont := make(map[string]*models.Node, len(dure.Content))
	for _, n := range dure.Content {
		dureCont[n.Name] = n
	}
	fmt.Println(dureCont)

	for i, n := range baceCont {
		if u, found := dureCont[n.Name]; found {
			baceCont[i] = u
		}
	}

	dure.Content = baceCont

	// return baceCont, nil
	return &dure, nil
}

func GetUpdate() models.Node {
	return tree2.getDir("")
}

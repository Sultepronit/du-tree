package du

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"strconv"
	"strings"
)

var discardIndex int

// remove json?
// type rawNode struct {
// 	Size    int64               `json:"size"`
// 	Temp    bool                `json:"temp,omitempty"`
// 	Content map[string]*rawNode `json:"content,omitempty"`
// }

// type FlatBranch struct {
// 	Name       string `json:"name"`
// 	Size       int    `json:"size"`
// 	HasContent bool   `json:"hasContent,omitempty"`
// }

// type Root struct {
// 	Size    int           `json:"size"`
// 	Content []*FlatBranch `json:"content,omitempty"`
// }

// var tree *rawNode

// var instantRoot *Root

// func fillTree(path []string, size int64) {
// 	// if len(path) == 1 {
// 	// 	log.Println(path, size)
// 	// }
// 	log.Println(path, size)
// 	if len(path) == 1 && path[0] == "" {
// 		tree.Size = size
// 		tree.Temp = false
// 	} else {
// 		node := tree
// 		for _, stage := range path {
// 			node.Size += size
// 			if val, prs := node.Content[stage]; prs {
// 				node = val
// 			} else {
// 				if node.Content == nil {
// 					node.Content = make(map[string]*rawNode)
// 				}

// 				new := &rawNode{Temp: true}
// 				node.Content[stage] = new
// 				node = new
// 			}
// 		}
// 		node.Size = size
// 		node.Temp = false
// 	}
// 	// tempPrinAsJson(tree)
// 	// tempPrinAsJson(getCachedBranch(path))
// 	// tempPrinAsJson(parseNodeContent(tree))
// 	tempPrinAsJson(parseNode(tree, "root"))
// }

func parseOutput2(line string) {
	parts := strings.SplitN(line, "\t", 2)
	if len(parts) != 2 {
		return
	}

	size, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		panic(err)
	}

	wholePath := strings.Split(parts[1], "/")
	path := wholePath[discardIndex:]

	// fillTree(path, size)
	tree2.fill(path, size)

	// if len(path) == 1 {
	// 	name := path[0]
	// 	// log.Println(path, size)
	// 	log.Println(name)
	// 	if name == "" {
	// 		// instantRoot.Size = size
	// 	} else {
	// 		// time.Sleep(time.Second)
	// 		// hasCont := false
	// 		// if len(tree.Content[name].Content) > 0 {
	// 		// 	hasCont = true
	// 		// }

	// 		// instantRoot.Content = append(instantRoot.Content, &FlatBranch{
	// 		// 	Name:       name,
	// 		// 	Size:       tree.Content[name].Size,
	// 		// 	HasContent: hasCont,
	// 		// })
	// 	}
	// 	// tempPrinAsJson(instantRoot)
	// }
}

func tempPrinAsJson(input any) {
	j, err := json.MarshalIndent(input, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(j))
}

// func Init(path string) {
func Init(path string, comm []string) {
	// tree = &rawNode{
	// 	Temp:    true,
	// 	Content: make(map[string]*rawNode),
	// }
	resetTree()
	// instantRoot = &Root{
	// 	Size: -1,
	// }

	discardIndex = len(strings.Split(path, "/")) - 1

	// cmd := exec.Command("du", "-ab", "--exclude=/proc", path)
	// cmd := exec.Command("du", "-ab", "--max-depth=2", path)
	// cmd := exec.Command("du", "-a", "--max-depth=1", path)
	// 9, 13
	// cmd := exec.Command("du", "-a", "--max-depth=3", path) // 120, 94, 81
	// 10, 11, 9, 9, 9
	// cmd := exec.Command("du", "-a", "--max-depth=4", path)
	// 14, 10, 10, 10, 10, 10
	// cmd := exec.Command("du", "-a", "--max-depth=5", path) // 96, 109, 126, 134
	// 48, 20, 18, 10, 10, 14, 15
	// cmd := exec.Command("du", "-a", "--exclude=/proc", path)

	// cmd := exec.Command("sudo", "du", "-a", "--max-depth=4", path)
	// cmd := exec.Command("du", "-a", "--max-depth=4", "~")
	// cmd := exec.Command("du", "-b", "--max-depth=5", path)
	// cmd := exec.Command("du", "-b", "--exclude=/proc", path)
	// cmd := exec.Command("sudo", "du", "-ab", "--exclude=/proc", path)
	// cmd := exec.Command("du", "-ab", "--exclude=/proc", path)
	// cm := []string{"du", "-b", "--exclude=/proc", path}
	// cmd := exec.Command(cm...)
	// cm := []string{"-b", "--exclude=/proc", path}
	// cmd := exec.Command("du", cm...)
	// cm := []string{"du", "-b", "--exclude=/proc", path}
	// cmd := exec.Command(cm[0], cm[1:]...)
	cmd := exec.Command(comm[0], comm[1:]...)
	// cmd.Stderr = os.Stderr // ?
	log.Println("cmd!")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Println(err)
	}

	if err := cmd.Start(); err != nil {
		log.Println(err)
	}

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		// fmt.Println("[", line, "]")
		// parts := strings.SplitN(line, "\t", 2)
		// fmt.Println(parts)
		parseOutput2(line)
	}

	if err := cmd.Wait(); err != nil {
		// log.Panic(err)
		if exitErr, ok := err.(*exec.ExitError); ok {
			if exitErr.ExitCode() != 0 {
				log.Printf("Command finished with non-zero code: %d", exitErr.ExitCode())
			}
		} else {
			log.Printf("Wait error: %v", err)
		}
	}

	log.Println("finish!")

	// tempPrinAsJson(tree)
	// tempPrinAsJson(getDir(""))
	// tempPrinAsJson(getDir("A"))
	// tempPrinAsJson(getDir("a/b"))
	// return &Root{
	// 	Size:    tree.Size,
	// 	Content: parseNodeContent(tree),
	// }
}

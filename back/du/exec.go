package du

import (
	"bufio"
	"log"
	"os/exec"
	"strconv"
	"strings"
)

type Branch struct {
	Size    int                `json:"size"`
	Content map[string]*Branch `json:"content,omitempty"`
}

type FlatBranch struct {
	Name       string `json:"name"`
	Size       int    `json:"size"`
	HasContent bool   `json:"hasContent,omitempty"`
}

type Root struct {
	Size    int           `json:"size"`
	Content []*FlatBranch `json:"content,omitempty"`
}

var tree *Branch
var instantRoot *Root

func fillTree(path []string, size int) {
	// if len(path) == 1 {
	// 	log.Println(path, size)
	// }
	if len(path) == 1 && path[0] == "" {
		tree.Size = size
	} else {
		node := tree
		for _, stage := range path {
			if val, prs := node.Content[stage]; prs {
				node = val
			} else {
				if node.Content == nil {
					node.Content = make(map[string]*Branch)
				}

				new := &Branch{}
				node.Content[stage] = new
				node = new
			}
		}
		node.Size = size
	}
}

func parseOutput2(line string, discardIndex int) {
	parts := strings.SplitN(line, "\t", 2)
	if len(parts) != 2 {
		return
	}

	size, err := strconv.Atoi(parts[0])
	if err != nil {
		panic(err)
	}

	wholePath := strings.Split(parts[1], "/")
	path := wholePath[discardIndex:]

	fillTree(path, size)

	if len(path) == 1 {
		name := path[0]
		// log.Println(path, size)
		log.Println(name)
		if name == "" {
			instantRoot.Size = size
		} else {
			// time.Sleep(time.Second)
			hasCont := false
			if len(tree.Content[name].Content) > 0 {
				hasCont = true
			}

			instantRoot.Content = append(instantRoot.Content, &FlatBranch{
				Name:       name,
				Size:       tree.Content[name].Size,
				HasContent: hasCont,
			})
		}
		// prinAsJson(instantRoot)
	}
}

func Init(path string) *Root {
	tree = &Branch{
		Content: make(map[string]*Branch),
	}
	instantRoot = &Root{
		Size: -1,
	}

	discardIndex := len(strings.Split(path, "/")) - 1

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
	cmd := exec.Command("du", "-b", "--max-depth=5", path)
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
		parseOutput2(line, discardIndex)
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

	// prinAsJson(tree)
	return &Root{
		Size:    tree.Size,
		Content: getBranchContent(tree),
	}
}

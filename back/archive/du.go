package main

import (
	"bufio"
	"log"
	"os/exec"
	"strconv"
	"strings"
)

type Node struct {
	Size    int              `json:"size"`
	Content map[string]*Node `json:"content,omitempty"`
}

//	var tree = &Node{
//		Content: make(map[string]*Node),
//	}
var tree *Node

func fillTree(path []string, size int) {
	if len(path) == 1 {
		log.Println(path, size)
	}
	if len(path) == 1 && path[0] == "" {
		tree.Size = size
	} else {
		node := tree
		for _, stage := range path {
			if val, prs := node.Content[stage]; prs {
				node = val
			} else {
				if node.Content == nil {
					node.Content = make(map[string]*Node)
				}

				new := &Node{}
				node.Content[stage] = new
				node = new
			}
		}
		node.Size = size
	}
}

func getDiscardIndex(path string) int {
	// parts := strings.Split(path, "/")
	return len(strings.Split(path, "/")) - 1
}

type Root struct {
	Size    int       `json:"size"`
	Content []*Branch `json:"content,omitempty"`
}

func parseOutput(text string, path string) *Root {
	rows := strings.Split(text, "\n")

	discardIndex := getDiscardIndex(path)

	for _, row := range rows {
		parts := strings.SplitN(row, "\t", 2)
		if len(parts) != 2 {
			continue
		}

		size, err := strconv.Atoi(parts[0])
		if err != nil {
			panic(err)
		}

		wholePath := strings.Split(parts[1], "/")
		path := wholePath[discardIndex:]

		fillTree(path, size)
	}

	log.Println("parsed!")

	return &Root{
		Size: tree.Size,
		// Content: getBranchContent(&tree),
		Content: getBranchContent(tree),
	}
}

func du(path string) *Root {
	cmd := exec.Command("du", "-ab", path)
	log.Println("cmd!")
	// cmd := exec.Command("du", "-b", path)
	output, err := cmd.Output()
	if err != nil {
		// panic(err)
		log.Printf("du2 error: %v", err)
	}
	log.Println("output!")

	return parseOutput(string(output), path)
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
}

func du2(path string) *Root {
	tree = &Node{
		Content: make(map[string]*Node),
	}

	discardIndex := len(strings.Split(path, "/")) - 1

	cmd := exec.Command("du", "-ab", "--exclude=/proc", path)
	// cmd := exec.Command("du", "-ab", "--max-depth=2", path)
	// cmd := exec.Command("du", "-a", "--max-depth=2", path)
	// cmd := exec.Command("du", "-a", "--exclude=/proc", path)
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

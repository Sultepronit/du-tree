package du

import (
	"bufio"
	"log"
	"os/exec"
	"strconv"
	"strings"
)

var discardIndex int

func parseOutput(line string) {
	// time.Sleep(time.Second)
	// time.Sleep(time.Millisecond * 200)
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

	tree2.fill(path, size)
}

// func Init(path string) {
func Init(path string, comm []string) {
	resetTree()

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
		parseOutput(line)
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
}

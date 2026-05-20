package du

import (
	"bufio"
	"log"
	"os/exec"
	"strconv"
	"strings"
	// "time"
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
	ResetTree()

	discardIndex = len(strings.Split(path, "/")) - 1

	args := comm[1:]
	args = append(args, path)

	// cmd := exec.Command(comm[0], comm[1:]...)
	cmd := exec.Command(comm[0], args...)
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
				log.Println(exitErr)
			}
		} else {
			log.Printf("Wait error: %v", err)
		}
	}

	log.Println("finish!")
}

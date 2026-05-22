package du

import (
	"bufio"
	"io"
	"log"
	"os/exec"
	"strconv"
	"strings"
)

var discardIndex int

func parseErr(line string) {
	if strings.HasSuffix(line, "Permission denied") {
		// log.Println(line)
		startIdx := strings.Index(line, "'")
		endIdx := strings.LastIndex(line, "'")

		if startIdx != -1 && endIdx != -1 && startIdx < endIdx {
			pathlLine := line[startIdx+1 : endIdx]
			log.Println("locked:", pathlLine)

			// DRY!
			wholePath := strings.Split(pathlLine, "/")
			path := wholePath[discardIndex:]
			tree2.fill(path, -1)
		}
	}
}

func parseOutput(line string) {
	// time.Sleep(time.Second)
	// time.Sleep(time.Millisecond * 200)
	parts := strings.SplitN(line, "\t", 2)
	if len(parts) != 2 {
		parseErr(line)
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

func Init(path string, comm []string) error {
	ResetTree()

	discardIndex = len(strings.Split(path, "/")) - 1

	args := comm[1:]
	args = append(args, path)

	// cmd := exec.Command(comm[0], comm[1:]...)
	cmd := exec.Command(comm[0], args...)
	// cmd.Stderr = os.Stderr // ?
	// cmd.Stderr = cmd.Stdout
	// cmd.Stderr = os.Stdout
	log.Println("cmd!")

	pr, pw := io.Pipe()
	cmd.Stdout = pw
	cmd.Stderr = pw

	// stdout, err := cmd.StdoutPipe()
	// if err != nil {
	// 	log.Println(err)
	// }

	if err := cmd.Start(); err != nil {
		log.Println(err)
		return err
	}

	go func() {
		defer pw.Close()
		cmd.Wait()
	}()

	// scanner := bufio.NewScanner(stdout)
	scanner := bufio.NewScanner(pr)
	for scanner.Scan() {
		line := scanner.Text()
		// log.Println("[", line, "]")
		// parts := strings.SplitN(line, "\t", 2)
		// fmt.Println(parts)
		parseOutput(line)
	}

	// if err := cmd.Wait(); err != nil {
	// 	// log.Panic(err)
	// 	if exitErr, ok := err.(*exec.ExitError); ok {
	// 		if exitErr.ExitCode() != 0 {
	// 			log.Printf("Command finished with non-zero code: %d", exitErr.ExitCode())
	// 			log.Println(exitErr)
	// 		}
	// 	} else {
	// 		log.Printf("Wait error: %v", err)
	// 	}
	// }

	log.Println("finish!")
	return nil
}

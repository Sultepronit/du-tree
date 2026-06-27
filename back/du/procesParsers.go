package du

import (
	"log"
	"strconv"
	"strings"
)

var discardIndex int

func parseErr(line string) {
	// fmt.Println("Unexpected line format:", line)
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
			tree.fill(path, -1)
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

	tree.fill(path, size)
}

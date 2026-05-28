package du

import (
	"bufio"
	"context"
	"io"
	"log"
	"os/exec"
	"strings"
)

// return to who?
func doStart(path string, comm []string, ctx context.Context) error {
	ResetTree()

	// ctx, cancel := context.WithCancel(context.Background())
	// defer cancel()

	discardIndex = len(strings.Split(path, "/")) - 1

	args := comm[1:]
	args = append(args, path)

	// cmd := exec.Command(comm[0], args...)
	cmd := exec.CommandContext(ctx, comm[0], args...)
	cmd.Env = append(cmd.Env, "LC_ALL=C")
	// cmd.Env = append(os.Environ(), "LC_ALL=es_ES.UTF-8")
	// fmt.Println(cmd.Env)
	log.Println("cmd!")

	pr, pw := io.Pipe()
	cmd.Stdout = pw
	cmd.Stderr = pw

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

	err := scanner.Err()
	if err != nil {
		log.Printf("Scanner error: %v", err)
		return err
	}

	// tree.cancel()
	tree.cancel = nil

	log.Println("finish!")
	return nil
}

// var manager struct {
// 	mu     sync.Mutex
// 	cancel context.CancelFunc
// }

func Start(path string, comm []string) {
	// manager.mu.Lock()
	// defer manager.mu.Unlock()
	tree.mu.Lock()
	defer tree.mu.Unlock()

	if tree.cancel != nil {
		log.Println("Previous scan is still running!")
	}

	ctx, cancel := context.WithCancel(context.Background())
	// manager.cancel = cancel
	tree.cancel = cancel

	// if manager.cancel != nil {

	go doStart(path, comm, ctx)
}

func Stop() {
	tree.mu.Lock()
	defer tree.mu.Unlock()

	if tree.cancel != nil {
		log.Println("Stopping scan...")
		tree.cancel()
		tree.cancel = nil
	} else {
		log.Println("No scan is currently running.")
	}
}

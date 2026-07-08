package scan

import (
	"context"
	"du-tree/models"
	"fmt"
	"log"
)

func run(ctx context.Context) {
	fmt.Println(ctx)
	fmt.Println(data)
}

func Init(req models.Request) {
	data.mu.Lock()
	defer data.mu.Unlock()

	if data.cancel != nil {
		log.Println("Previous scan is still running!")
	}

	ctx, cancel := context.WithCancel(context.Background())
	data.cancel = cancel

	data.request = req

	data.inodes = make(map[uint64]bool)
	data.result = &models.Node{
		SizeIsTemp: true,
		Content:    make([]*models.Node, 0, 10),
	}

	go run(ctx)
}

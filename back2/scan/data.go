package scan

import (
	"context"
	"du-tree/models"
	"sync"
)

type scanData struct {
	mu      sync.RWMutex
	cancel  context.CancelFunc
	request models.Request
	result  *models.Node
	inodes  map[uint64]bool
}

var data scanData

// func reset() {
// 	data.mu.Lock()
// 	defer data.mu.Unlock()
// 	// data.cancel = nil
// 	// data.request = models.Request{}
// 	data.result = nil
// }

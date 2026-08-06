package utils

import (
	"du-tree/internal/models"
	"os"
	"os/user"
)

func GetSystemContext() (re models.SystemContext) {
	re.IsRoot = os.Getuid() == 0
	if u, err := user.Current(); err == nil {
		re.User = u.Username
	}
	host, _ := os.Hostname()
	re.Host = host
	return re
}

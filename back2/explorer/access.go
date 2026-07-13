package explorer

import (
	"path/filepath"

	"golang.org/x/sys/unix"
)

func IsAccessible(path string, name string) bool {
	fullP := filepath.Join(path, name)
	err := unix.Access(fullP, unix.R_OK|unix.X_OK)
	return err == nil
}

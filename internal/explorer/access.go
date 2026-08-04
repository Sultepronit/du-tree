package explorer

import (
	"errors"
	"io"
	"os"
	"path/filepath"

	"golang.org/x/sys/unix"
)

func IsAccessible(path string, name string) bool {
	fullP := filepath.Join(path, name)
	err := unix.Access(fullP, unix.R_OK|unix.X_OK)
	return err == nil
}

type DirStatus int

const (
	Ok DirStatus = iota
	Forbidden
	NotFound
	Empty
)

func CheckDirStatus(path string) DirStatus {
	f, err := os.Open(path)
	if err != nil {
		if os.IsPermission(err) {
			return Forbidden
		}
		return NotFound
	}
	defer f.Close()

	names, err := f.Readdirnames(1)
	if err != nil {
		if errors.Is(err, io.EOF) {
			return Empty
		}
		if os.IsNotExist(err) {
			return NotFound
		}
		return Forbidden
	}

	if len(names) == 0 {
		return Empty
	}

	return Ok
}

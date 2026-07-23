package utils

import "os/exec"

func OpenURL(url string) error {
	// var cmd *exec.Cmd
	cmd := exec.Command("xdg-open", url)
	return cmd.Start()
}

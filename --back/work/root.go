package work

import (
	"os"
	"os/exec"
)

func ReRoot(utility string) error {
	if os.Getuid() == 0 {
		return nil
	}
	myself, err := os.Executable()
	if err != nil {
		return err
	}

	cmd := exec.Command(utility, myself)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err = cmd.Start()
	if err != nil {
		return err
	}

	os.Exit(0)

	return nil
}

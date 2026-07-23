package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

// Структура для збору чистої статистики папки
type FolderStats struct {
	ActualSize int64           // Вага в байтах на диску (Блоки * 512)
	SeenInodes map[uint64]bool // Захист від подвійного підрахунку хардлінків
}

func ScanDir(path string, stats *FolderStats) error {
	// fmt.Print(path)
	thisSize := 0
	entries, err := os.ReadDir(path)
	if err != nil {
		return err // Пропускаємо папки без доступу (у вас для цього червоні замки!)
	}

	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Витягуємо сирі системні дані Linux
		sysStat, ok := info.Sys().(*syscall.Stat_t)
		if !ok {
			continue
		}

		// 1. Перевірка на хардлінки: якщо цей інод уже бачили — ігноруємо вагу
		if sysStat.Nlink > 1 {
			if stats.SeenInodes[sysStat.Ino] {
				continue
			}
			stats.SeenInodes[sysStat.Ino] = true
		}

		// fmt.Println(entry.Name())
		// 2. Рахуємо РЕАЛЬНИЙ розмір на диску через блоки (захист від Sparse files та 1-байтних файлів)
		// fileDiskSize := sysStat.Blocks * 512
		// stats.ActualSize += fileDiskSize
		// thisSize += int(fileDiskSize)
		// fmt.Println(fullPath, fileDiskSize)

		// 3. Якщо це папка — занурюємось далі вглиб (Рекурсія)
		if entry.IsDir() {

			// Тут же, в цей самий момент, можна швиденько кинути проміжний
			// результат в SSE-канал для вашого Real-time рендерингу!
			// fileDiskSize := 4 * 512
			// stats.ActualSize += int64(fileDiskSize)
			// fmt.Println(stats.ActualSize)
			// thisSize += int(fileDiskSize)
			ScanDir(fullPath, stats)
		} else {
			fileDiskSize := info.Size()
			stats.ActualSize += fileDiskSize
			// fmt.Println(stats.ActualSize)
			thisSize += int(fileDiskSize)
			// fmt.Println(fullPath, fileDiskSize)
		}
	}
	// fmt.Println("dir total:", path, thisSize)
	return nil
}

func getRoot(target string) (int64, error) {
	info, err := os.Lstat(target)
	if err != nil {
		return 0, err
	}
	if sysStat, ok := info.Sys().(*syscall.Stat_t); ok {
		return sysStat.Blocks * 512, nil
	}

	return 0, errors.New("no file info")
}

func main() {
	path := flag.String("p", "../", "The scan path")
	flag.Parse()
	// target := "../" // Нацькуйте на домашню папку
	stats := &FolderStats{
		SeenInodes: make(map[uint64]bool),
	}

	fmt.Println("Скануємо...")
	// ScanDir(target, stats)
	// root, err := getRoot(*path)
	// if err != nil {
	// 	fmt.Println(err)
	// 	return
	// }
	// stats.ActualSize = root
	// fmt.Println("root:", root)

	ScanDir(*path, stats)

	// Переводимо в мегабайти для порівняння з вашим GUI
	fmt.Printf("Результат чистого Go: %.2f B\n", float64(stats.ActualSize))
	// fmt.Println(stats.SeenInodes)
}
